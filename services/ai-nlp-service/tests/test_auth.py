"""Tests for the internal API key check (X-Internal-API-Key / DEV_MODE)."""
import pytest

from app.config import settings
from app.services import nlp_service as nlp_service_module
from tests.conftest import AUTH_HEADERS, FakeNLPService


@pytest.mark.asyncio
async def test_extract_without_api_key_returns_403(client):
    resp = await client.post("/extract", json={"text": "سلام"})
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Invalid internal API key"


@pytest.mark.asyncio
async def test_extract_with_wrong_api_key_returns_403(client):
    resp = await client.post(
        "/extract",
        headers={"X-Internal-API-Key": "wrong-key"},
        json={"text": "سلام"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_extract_with_valid_api_key_returns_200(client):
    resp = await client.post(
        "/extract", headers=AUTH_HEADERS, json={"text": "سلام پوستم قرمز شده"}
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_extract_dev_mode_skips_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "DEV_MODE", True)
    resp = await client.post("/extract", json={"text": "سلام پوستم قرمز شده"})
    assert resp.status_code == 200
    assert resp.json()["detected"]


@pytest.mark.asyncio
async def test_extract_returns_503_when_model_not_loaded(client, monkeypatch):
    monkeypatch.setattr(
        nlp_service_module, "nlp_service", FakeNLPService(loaded=False)
    )
    resp = await client.post(
        "/extract", headers=AUTH_HEADERS, json={"text": "سلام"}
    )
    assert resp.status_code == 503
    assert "Model is not loaded" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_model_info_without_api_key_returns_403(client):
    resp = await client.get("/model-info")
    assert resp.status_code == 403
