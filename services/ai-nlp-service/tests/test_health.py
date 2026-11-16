"""Tests for GET /health and GET /model-info."""
import pytest

from app.config import settings
from app.services import nlp_service as nlp_service_module
from tests.conftest import AUTH_HEADERS, FakeNLPService


@pytest.mark.asyncio
async def test_health_healthy_when_model_loaded(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["model_loaded"] is True
    assert body["device"] == "cpu"
    assert body["evidence_count"] == 3
    assert "error" not in body  # response_model_exclude_none


@pytest.mark.asyncio
async def test_health_unhealthy_when_model_not_loaded(client, monkeypatch):
    monkeypatch.setattr(
        nlp_service_module, "nlp_service", FakeNLPService(loaded=False)
    )
    resp = await client.get("/health")
    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "unhealthy"
    assert body["model_loaded"] is False
    assert body["error"]


@pytest.mark.asyncio
async def test_model_info_returns_expected_fields(client):
    resp = await client.get("/model-info", headers=AUTH_HEADERS)
    assert resp.status_code == 200
    body = resp.json()
    assert body["model_name"] == "HooshvareLab/bert-fa-base-uncased"
    assert body["checkpoint_path"] == settings.MODEL_PATH
    assert body["evidence_path"] == settings.EVIDENCE_PATH
    assert body["model_version"] == settings.MODEL_VERSION
    assert body["evidence_count"] == 3
    assert body["threshold_default"] == 0.3
    assert body["max_len"] == 128
    assert body["device"] == "cpu"
    # From the checkpoint dict: checkpoint.get("f1"), checkpoint.get("epoch").
    assert body["training_f1"] == 0.84
    assert body["training_epoch"] == 3
    assert body["loaded_at"] == "2026-01-15T10:30:00Z"


@pytest.mark.asyncio
async def test_model_info_returns_503_when_model_not_loaded(client, monkeypatch):
    monkeypatch.setattr(
        nlp_service_module, "nlp_service", FakeNLPService(loaded=False)
    )
    resp = await client.get("/model-info", headers=AUTH_HEADERS)
    assert resp.status_code == 503
    assert "detail" in resp.json()
