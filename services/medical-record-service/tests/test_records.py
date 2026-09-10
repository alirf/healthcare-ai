"""End-to-end tests for the medical record flow."""
import io
import uuid

import pytest

from tests.conftest import (
    PATIENT_ID,
    PATIENT2_ID,
    DOCTOR_ID,
    INTERNAL_HEADERS,
    auth_headers,
)


@pytest.mark.asyncio
async def test_create_and_list_records(client):
    ph = auth_headers(PATIENT_ID, "patient")

    # Open a heart-attack record
    r = await client.post(
        "/records",
        json={
            "record_type": "heart_attack",
            "title": "سکته قلبی - اسفند ۱۴۰۴",
            "description": "درد قفسه سینه و انتقال به اورژانس",
            "icd10_code": "I21",
        },
        headers=ph,
    )
    assert r.status_code == 201
    record = r.json()
    assert record["status"] == "active"
    assert record["patient_id"] == PATIENT_ID

    # Second record (general)
    r = await client.post("/records", json={"record_type": "general", "title": "ویزیت عمومی"},
                          headers=ph)
    assert r.status_code == 201

    r = await client.get("/records", headers=ph)
    assert r.status_code == 200
    assert r.json()["total"] == 2

    # Status filter
    r = await client.get("/records?status_filter=active", headers=ph)
    assert r.json()["total"] == 2

    # Update
    r = await client.put(f"/records/{record['id']}",
                         json={"title": "سکته قلبی - به‌روزرسانی شد"}, headers=ph)
    assert r.status_code == 200
    assert r.json()["title"] == "سکته قلبی - به‌روزرسانی شد"


@pytest.mark.asyncio
async def test_ownership_enforced(client):
    ph = auth_headers(PATIENT_ID, "patient")

    r = await client.post("/records", json={"record_type": "general", "title": "private"},
                          headers=ph)
    record_id = r.json()["id"]

    r = await client.get(f"/records/{record_id}", headers=auth_headers(PATIENT2_ID, "patient"))
    assert r.status_code == 403

    r = await client.put(f"/records/{record_id}", json={"title": "hacked"},
                         headers=auth_headers(PATIENT2_ID, "patient"))
    assert r.status_code == 403

    r = await client.get(f"/records/{record_id}", headers=ph)
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_close_and_archive_flow(client):
    ph = auth_headers(PATIENT_ID, "patient")

    r = await client.post("/records", json={"record_type": "diabetes", "title": "دیابت"},
                          headers=ph)
    record_id = r.json()["id"]

    # active -> closed
    r = await client.post(f"/records/{record_id}/close", headers=ph)
    assert r.status_code == 200
    assert r.json()["status"] == "closed"
    assert r.json()["closed_at"] is not None

    # closed -> anything is rejected
    r = await client.post(f"/records/{record_id}/archive", headers=ph)
    assert r.status_code == 409

    # archive flow on a fresh record: active -> archived -> closed
    r = await client.post("/records", json={"record_type": "hypertension", "title": "فشار خون"},
                          headers=ph)
    rid2 = r.json()["id"]
    r = await client.post(f"/records/{rid2}/archive", headers=ph)
    assert r.json()["status"] == "archived"
    r = await client.post(f"/records/{rid2}/close", headers=ph)
    assert r.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_visit_linking_internal(client):
    ph = auth_headers(PATIENT_ID, "patient")

    r = await client.post("/records", json={"record_type": "heart_attack", "title": "سکته"},
                          headers=ph)
    record_id = r.json()["id"]

    visit_id = str(uuid.uuid4())

    # Link two different visits on the same record (several doctors over time)
    for i in range(2):
        r = await client.post(
            f"/internal/records/{record_id}/visits",
            json={"visit_id": visit_id if i == 0 else str(uuid.uuid4()), "patient_id": PATIENT_ID},
            headers=INTERNAL_HEADERS,
        )
        assert r.status_code == 201
        if i == 0:
            first_link = r.json()

    # Duplicate link rejected
    r = await client.post(
        f"/internal/records/{record_id}/visits",
        json={"visit_id": first_link["visit_id"], "patient_id": PATIENT_ID},
        headers=INTERNAL_HEADERS,
    )
    assert r.status_code == 409

    # Patient cannot link a visit belonging to another patient
    r = await client.post(
        f"/internal/records/{record_id}/visits",
        json={"visit_id": str(uuid.uuid4()), "patient_id": PATIENT2_ID},
        headers=INTERNAL_HEADERS,
    )
    assert r.status_code == 403

    # Detail shows the visits
    r = await client.get(f"/records/{record_id}", headers=ph)
    assert len(r.json()["visits"]) == 2

    # Internal listing
    r = await client.get(f"/internal/records/{record_id}/visits", headers=INTERNAL_HEADERS)
    assert r.status_code == 200
    assert len(r.json()) == 2

    # Patient records internal endpoint
    r = await client.get(f"/internal/records/patient/{PATIENT_ID}", headers=INTERNAL_HEADERS)
    assert r.status_code == 200
    assert r.json()["exists"] is True
    assert r.json()["total"] == 1

    r = await client.get(f"/internal/records/patient/{PATIENT2_ID}/exists",
                         headers=INTERNAL_HEADERS)
    assert r.json()["exists"] is False


@pytest.mark.asyncio
async def test_record_files_flow(client):
    ph = auth_headers(PATIENT_ID, "patient")

    r = await client.post("/records", json={"record_type": "general", "title": "آزمایش"},
                          headers=ph)
    record_id = r.json()["id"]

    # Upload a lab result (MinIO is stubbed in conftest)
    r = await client.post(
        f"/records/{record_id}/files",
        files={"file": ("lab-result.pdf", io.BytesIO(b"fake pdf"), "application/pdf")},
        data={"description": "نتیجه آزمایش خون"},
        headers=ph,
    )
    assert r.status_code == 201
    f = r.json()
    assert f["file_name"] == "lab-result.pdf"
    assert f["file_url"] is not None
    assert "fake-key" in f["file_url"]

    # List files
    r = await client.get(f"/records/{record_id}/files", headers=ph)
    assert len(r.json()) == 1

    # Another patient cannot upload to this record
    r = await client.post(
        f"/records/{record_id}/files",
        files={"file": ("x.png", io.BytesIO(b"img"), "image/png")},
        headers=auth_headers(PATIENT2_ID, "patient"),
    )
    assert r.status_code == 403

    # Delete
    r = await client.delete(f"/records/{record_id}/files/{f['id']}", headers=ph)
    assert r.status_code == 204
    r = await client.get(f"/records/{record_id}/files", headers=ph)
    assert len(r.json()) == 0


@pytest.mark.asyncio
async def test_internal_requires_api_key(client):
    r = await client.get(f"/internal/records/patient/{PATIENT_ID}")
    assert r.status_code == 403

    r = await client.get(f"/internal/records/patient/{PATIENT_ID}",
                         headers={"X-Internal-API-Key": "wrong"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_doctor_records_requires_doctor_role(client):
    # Patient cannot use doctor endpoints
    r = await client.get("/doctor/records", headers=auth_headers(PATIENT_ID, "patient"))
    assert r.status_code == 403

    # Doctor with no treated patients -> empty list (httpx to intake fails -> [])
    r = await client.get("/doctor/records", headers=auth_headers(DOCTOR_ID, "doctor"))
    assert r.status_code == 200
    assert r.json() == []
