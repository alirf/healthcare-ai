"""Tests for internal API endpoints."""
import pytest


@pytest.mark.asyncio
async def test_internal_api_key_invalid(client):
    """Test internal endpoint with invalid API key."""
    response = await client.get(
        "/internal/profile/patient/550e8400-e29b-41d4-a716-446655440000/summary",
        headers={"X-Internal-API-Key": "invalid-key"},
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_internal_api_key_missing(client):
    """Test internal endpoint without API key."""
    response = await client.get(
        "/internal/profile/patient/550e8400-e29b-41d4-a716-446655440000/summary",
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_check_patient_exists_false(client, mock_internal_key, monkeypatch):
    """Test checking profile existence when none exists."""
    from app.dependencies import auth
    async def mock_verify():
        return True
    monkeypatch.setattr(auth, "verify_internal_api_key", mock_verify)
    
    response = await client.get(
        "/internal/profile/patient/550e8400-e29b-41d4-a716-446655440000/exists",
        headers={"X-Internal-API-Key": mock_internal_key},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["exists"] is False