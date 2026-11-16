"""Tests for POST /extract."""
import pytest

from app.config import settings
from app.services import nlp_service as nlp_service_module
from tests.conftest import AUTH_HEADERS, FakeNLPService


@pytest.mark.asyncio
async def test_extract_happy_path(client):
    resp = await client.post(
        "/extract",
        headers=AUTH_HEADERS,
        json={"text": "سلام پوستم قرمز شده. سرم درد میکنه تب هم دارم"},
    )
    assert resp.status_code == 200
    body = resp.json()

    # Sorted by confidence desc: 0.87 before 0.51.
    assert [d["evidence_id"] for d in body["detected"]] == ["E_19_0001", "E_19_0002"]
    assert body["detected"][0]["confidence"] == 0.87
    assert body["detected"][0]["name"] == "skin_lesions"
    assert body["detected"][0]["name_fa"] == "ضایعات پوستی"
    assert body["detected"][0]["data_type"] == "B"
    assert body["detected"][0]["code_question"] == "E_19_0001"

    # Response envelope.
    assert body["threshold"] == 0.3
    assert body["apply_hierarchy_filter"] is True
    assert body["truncated"] is False
    assert body["model_version"] == settings.MODEL_VERSION
    assert isinstance(body["inference_time_ms"], float)


@pytest.mark.asyncio
async def test_extract_passes_through_metadata(client):
    resp = await client.post(
        "/extract", headers=AUTH_HEADERS, json={"text": "راش قرمز است"}
    )
    assert resp.status_code == 200
    color = next(d for d in resp.json()["detected"] if d["evidence_id"] == "E_19_0002")
    # "possible-values" keeps its original hyphenated key (pass-through).
    assert color["possible-values"] == ["V_11", "V_157"]
    assert color["value_meaning"]["V_157"]["en"] == "red"
    assert color["default_value"] == "V_11"
    assert color["question_fa"] == "راش/ضایعه چه رنگی است؟"


@pytest.mark.asyncio
async def test_extract_empty_text_returns_empty(client):
    resp = await client.post("/extract", headers=AUTH_HEADERS, json={"text": ""})
    assert resp.status_code == 200
    body = resp.json()
    assert body["detected"] == []
    assert body["truncated"] is False


@pytest.mark.asyncio
async def test_extract_whitespace_only_text_returns_empty(client):
    resp = await client.post("/extract", headers=AUTH_HEADERS, json={"text": "   \n\t  "})
    assert resp.status_code == 200
    assert resp.json()["detected"] == []


@pytest.mark.asyncio
async def test_extract_long_text_is_truncated(client):
    resp = await client.post("/extract", headers=AUTH_HEADERS, json={"text": "م" * 6000})
    assert resp.status_code == 200
    body = resp.json()
    assert body["truncated"] is True
    assert len(body["text"]) == 5000


@pytest.mark.asyncio
async def test_extract_high_threshold_keeps_only_top(client, monkeypatch):
    # The spec's default fixture (0.87 / 0.51) would return nothing with a
    # strict "> 0.9" filter, so this test uses a top prediction of 0.95
    # (documented in README ## Decisions).
    monkeypatch.setattr(
        nlp_service_module,
        "nlp_service",
        FakeNLPService(predictions=[("E_19_0001", 0.95), ("E_19_0002", 0.51)]),
    )
    resp = await client.post(
        "/extract",
        headers=AUTH_HEADERS,
        json={"text": "بیمار تب دارد", "threshold": 0.9},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["threshold"] == 0.9
    assert len(body["detected"]) == 1
    assert body["detected"][0]["evidence_id"] == "E_19_0001"
    assert body["detected"][0]["confidence"] == 0.95


@pytest.mark.asyncio
async def test_hierarchy_filter_drops_orphan_child(client, monkeypatch):
    # Child (rash color) predicted, parent (rash present) below threshold —
    # clinically meaningless, so the child must be filtered out.
    monkeypatch.setattr(
        nlp_service_module,
        "nlp_service",
        FakeNLPService(predictions=[("E_19_0002", 0.8)]),
    )
    resp = await client.post(
        "/extract",
        headers=AUTH_HEADERS,
        json={"text": "راش قرمز است", "apply_hierarchy_filter": True},
    )
    assert resp.status_code == 200
    assert resp.json()["detected"] == []


@pytest.mark.asyncio
async def test_no_hierarchy_filter_keeps_child(client, monkeypatch):
    monkeypatch.setattr(
        nlp_service_module,
        "nlp_service",
        FakeNLPService(predictions=[("E_19_0002", 0.8)]),
    )
    resp = await client.post(
        "/extract",
        headers=AUTH_HEADERS,
        json={"text": "راش قرمز است", "apply_hierarchy_filter": False},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["apply_hierarchy_filter"] is False
    assert [d["evidence_id"] for d in body["detected"]] == ["E_19_0002"]


@pytest.mark.asyncio
async def test_top_k_limits_results(client, monkeypatch):
    monkeypatch.setattr(
        nlp_service_module,
        "nlp_service",
        FakeNLPService(
            predictions=[("E_19_0001", 0.87), ("E_19_0003", 0.75), ("E_19_0002", 0.51)]
        ),
    )
    resp = await client.post(
        "/extract",
        headers=AUTH_HEADERS,
        json={"text": "تب و ضایعه پوستی دارم", "top_k": 1},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["detected"]) == 1
    assert body["detected"][0]["evidence_id"] == "E_19_0001"


@pytest.mark.asyncio
async def test_extract_invalid_threshold_returns_422(client):
    resp = await client.post(
        "/extract",
        headers=AUTH_HEADERS,
        json={"text": "سلام", "threshold": 1.5},
    )
    assert resp.status_code == 422
