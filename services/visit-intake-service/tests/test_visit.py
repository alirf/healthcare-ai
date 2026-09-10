"""End-to-end tests for the visit intake flow."""
import pytest

from tests.conftest import (
    PATIENT_ID,
    PATIENT2_ID,
    DOCTOR_ID,
    INTERNAL_HEADERS,
    auth_headers,
)


@pytest.mark.asyncio
async def test_create_and_list_visits(client):
    # Start a visit on a medical record (e.g. the heart-attack record)
    r = await client.post(
        "/visits",
        json={
            "medical_record_id": "880e8400-e29b-41d4-a716-446655440003",
            "chief_complaint": "درد قفسه سینه",
            "priority": "high",
        },
        headers=auth_headers(PATIENT_ID, "patient"),
    )
    assert r.status_code == 201
    visit = r.json()
    assert visit["status"] == "intake"
    assert visit["medical_record_id"] == "880e8400-e29b-41d4-a716-446655440003"

    # Second visit on the same record (patient comes back later)
    r = await client.post("/visits", json={}, headers=auth_headers(PATIENT_ID, "patient"))
    assert r.status_code == 201

    r = await client.get("/visits", headers=auth_headers(PATIENT_ID, "patient"))
    assert r.status_code == 200
    assert r.json()["total"] == 2

    # Single visit
    r = await client.get(f"/visits/{visit['id']}", headers=auth_headers(PATIENT_ID, "patient"))
    assert r.status_code == 200
    assert r.json()["chief_complaint"] == "درد قفسه سینه"


@pytest.mark.asyncio
async def test_ownership_enforced(client):
    r = await client.post("/visits", json={}, headers=auth_headers(PATIENT_ID, "patient"))
    visit_id = r.json()["id"]

    r = await client.get(f"/visits/{visit_id}", headers=auth_headers(PATIENT2_ID, "patient"))
    assert r.status_code == 403

    r = await client.post(
        f"/visits/{visit_id}/messages",
        json={"content": "hello"},
        headers=auth_headers(PATIENT2_ID, "patient"),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_messages_and_manual_symptoms(client):
    r = await client.post("/visits", json={}, headers=auth_headers(PATIENT_ID, "patient"))
    visit_id = r.json()["id"]

    # Text messages keep ordering via sequence
    r = await client.post(
        f"/visits/{visit_id}/messages",
        json={"content": "سردرد از دیشب شروع شد"},
        headers=auth_headers(PATIENT_ID, "patient"),
    )
    assert r.status_code == 201
    assert r.json()["sequence"] == 1

    r = await client.post(
        f"/visits/{visit_id}/messages",
        json={"content": "تب هم دارم"},
        headers=auth_headers(PATIENT_ID, "patient"),
    )
    assert r.json()["sequence"] == 2

    # Manual symptom
    r = await client.post(
        f"/visits/{visit_id}/symptoms",
        json={"symptom_name": "headache", "severity": "moderate", "body_part": "head"},
        headers=auth_headers(PATIENT_ID, "patient"),
    )
    assert r.status_code == 201
    assert r.json()["source"] == "manual"

    r = await client.get(
        f"/visits/{visit_id}/symptoms", headers=auth_headers(PATIENT_ID, "patient")
    )
    assert len(r.json()) == 1


@pytest.mark.asyncio
async def test_full_visit_flow_to_final_prescription(client):
    ih = INTERNAL_HEADERS
    ph = auth_headers(PATIENT_ID, "patient")
    dh = auth_headers(DOCTOR_ID, "doctor")

    # 1. Patient starts a visit and describes the problem
    r = await client.post("/visits", json={"chief_complaint": "درد قفسه سینه"}, headers=ph)
    visit_id = r.json()["id"]
    await client.post(f"/visits/{visit_id}/messages", json={"content": "درد به بازو منتقل می‌شود"}, headers=ph)
    await client.post(
        f"/visits/{visit_id}/symptoms",
        json={"symptom_name": "chest_pain", "severity": "severe"},
        headers=ph,
    )

    # 2. Patient submits -> AI processing
    r = await client.post(f"/visits/{visit_id}/submit", headers=ph)
    assert r.json()["status"] == "ai_processing"

    # 3. AI services push their results
    r = await client.post(
        f"/internal/intake/visits/{visit_id}/symptoms/ai",
        json={
            "symptoms": [
                {"symptom_name": "dyspnea", "confidence": 0.91},
                {"symptom_name": "chest_pain", "confidence": 0.87},  # duplicate -> skipped
            ],
            "model_version": "parsbert-v1",
        },
        headers=ih,
    )
    assert r.status_code == 201
    assert len(r.json()) == 1  # chest_pain already exists as manual, only dyspnea added

    r = await client.post(
        f"/internal/intake/visits/{visit_id}/disease-suggestions",
        json={
            "suggestions": [
                {"disease_name": "Myocardial Infarction", "icd10_code": "I21",
                 "probability": 0.82, "rank": 1, "rationale": "chest pain + dyspnea"},
                {"disease_name": "Stable Angina", "icd10_code": "I20",
                 "probability": 0.61, "rank": 2},
            ],
            "model_version": "dx-v1",
        },
        headers=ih,
    )
    assert r.status_code == 201

    r = await client.post(
        f"/internal/intake/visits/{visit_id}/prescription-draft",
        json={
            "items": [{"drug_name": "Aspirin", "dosage": "80mg", "frequency": "daily", "duration_days": 30}],
            "ai_notes": "قبل غذا",
            "model_version": "rx-v1",
        },
        headers=ih,
    )
    assert r.status_code == 201

    # 4. AI done -> visit appears in the doctor queue
    r = await client.put(f"/internal/intake/visits/{visit_id}/status",
                         json={"status": "doctor_assigned"}, headers=ih)
    assert r.json()["status"] == "doctor_assigned"

    r = await client.get("/doctor/visits/queue", headers=dh)
    assert any(v["id"] == visit_id for v in r.json()["visits"])

    # 5. Doctor claims the visit and reviews the AI context
    r = await client.post(f"/doctor/visits/{visit_id}/claim", headers=dh)
    assert r.json()["status"] == "in_chat"

    r = await client.get(f"/doctor/visits/{visit_id}/context", headers=dh)
    ctx = r.json()
    assert len(ctx["messages"]) == 1
    assert len(ctx["symptoms"]) == 2          # manual chest_pain + AI dyspnea
    assert len(ctx["disease_suggestions"]) == 2
    assert len(ctx["prescription_drafts"]) == 1

    # 6. Doctor accepts the top AI suggestion
    top = ctx["disease_suggestions"][0]
    r = await client.put(
        f"/doctor/visits/{visit_id}/suggestions/{top['id']}",
        json={"decision": "accepted"},
        headers=dh,
    )
    assert r.json()["doctor_decision"] == "accepted"

    # 7. Doctor-patient chat (both directions)
    r = await client.post(f"/visits/{visit_id}/chat",
                          json={"content": "سلام، درد از کی شروع شده؟"}, headers=dh)
    assert r.status_code == 201
    r = await client.post(f"/visits/{visit_id}/chat",
                          json={"content": "از دیشب"}, headers=ph)
    assert r.status_code == 201

    r = await client.get(f"/visits/{visit_id}/chat", headers=ph)
    assert len(r.json()) == 2

    # 8. Doctor issues the final prescription -> visit completed
    r = await client.post(
        f"/doctor/visits/{visit_id}/prescription",
        json={
            "diagnosis_text": "حمله قلبی مشکوک",
            "items": [{"drug_name": "Aspirin", "dosage": "80mg", "frequency": "daily", "duration_days": 30}],
        },
        headers=dh,
    )
    assert r.status_code == 201
    assert r.json()["items"][0]["drug_name"] == "Aspirin"

    # 9. Patient reads the final prescription
    r = await client.get(f"/visits/{visit_id}/prescription", headers=ph)
    assert r.status_code == 200

    r = await client.get(f"/visits/{visit_id}", headers=ph)
    assert r.json()["status"] == "completed"

    # 10. Duplicate final prescription is rejected
    r = await client.post(
        f"/doctor/visits/{visit_id}/prescription",
        json={"items": []},
        headers=dh,
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_invalid_transition_rejected(client):
    r = await client.post("/visits", json={}, headers=auth_headers(PATIENT_ID, "patient"))
    visit_id = r.json()["id"]

    # intake -> completed is not allowed
    r = await client.post(f"/visits/{visit_id}/submit", headers=auth_headers(PATIENT_ID, "patient"))
    assert r.json()["status"] == "ai_processing"

    # patient cannot skip ahead to completed
    r = await client.put(
        f"/internal/intake/visits/{visit_id}/status",
        json={"status": "completed"},
        headers=INTERNAL_HEADERS,
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_internal_requires_api_key(client):
    r = await client.get("/internal/intake/visits/550e8400-e29b-41d4-a716-446655440000/context")
    assert r.status_code == 403

    r = await client.get(
        "/internal/intake/visits/550e8400-e29b-41d4-a716-446655440000/context",
        headers={"X-Internal-API-Key": "wrong"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_link_medical_record_internal(client):
    r = await client.post("/visits", json={}, headers=auth_headers(PATIENT_ID, "patient"))
    visit_id = r.json()["id"]
    assert r.json()["medical_record_id"] is None

    r = await client.put(
        f"/internal/intake/visits/{visit_id}/medical-record",
        json={"medical_record_id": "880e8400-e29b-41d4-a716-446655440003"},
        headers=INTERNAL_HEADERS,
    )
    assert r.status_code == 200
    assert r.json()["medical_record_id"] == "880e8400-e29b-41d4-a716-446655440003"
