"""Tests for patient profile endpoints."""
import pytest
from uuid import UUID

from app.models.patient import PatientProfile, PatientAllergy, PatientMedication, PatientChronicCondition


@pytest.mark.asyncio
async def test_create_patient_profile(client, db_session, mock_patient_token, monkeypatch):
    """Test creating a patient profile."""
    # Mock JWT validation
    from app.dependencies import auth
    async def mock_get_current_user():
        return mock_patient_token
    
    monkeypatch.setattr(auth, "get_current_user", mock_get_current_user)
    monkeypatch.setattr(auth, "require_role", lambda role: mock_get_current_user)
    
    response = await client.post(
        "/profile/patient/me",
        json={
            "full_name": "Test Patient",
            "birth_date": "1990-01-01",
            "gender": "male",
            "height_cm": 175,
            "weight_kg": 70,
            "blood_type": "O+",
            "phone": "+1234567890",
        },
        headers={"Authorization": "Bearer fake-token"},
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Test Patient"
    assert data["gender"] == "male"
    assert data["height_cm"] == 175
    assert data["weight_kg"] == 70


@pytest.mark.asyncio
async def test_get_patient_profile_not_found(client, mock_patient_token, monkeypatch):
    """Test getting profile when none exists."""
    from app.dependencies import auth
    async def mock_get_current_user():
        return mock_patient_token
    monkeypatch.setattr(auth, "get_current_user", mock_get_current_user)
    monkeypatch.setattr(auth, "require_role", lambda role: mock_get_current_user)
    
    response = await client.get(
        "/profile/patient/me",
        headers={"Authorization": "Bearer fake-token"},
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_allergy(client, db_session, mock_patient_token, monkeypatch):
    """Test adding an allergy."""
    from app.dependencies import auth
    async def mock_get_current_user():
        return mock_patient_token
    monkeypatch.setattr(auth, "get_current_user", mock_get_current_user)
    monkeypatch.setattr(auth, "require_role", lambda role: mock_get_current_user)
    
    # First create profile
    await client.post(
        "/profile/patient/me",
        json={
            "full_name": "Test Patient",
            "birth_date": "1990-01-01",
            "gender": "male",
        },
        headers={"Authorization": "Bearer fake-token"},
    )
    
    # Add allergy
    response = await client.post(
        "/profile/patient/me/allergies",
        json={
            "allergy_name": "Penicillin",
            "severity": "severe",
            "reaction_description": "Difficulty breathing",
        },
        headers={"Authorization": "Bearer fake-token"},
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["allergy_name"] == "Penicillin"
    assert data["severity"] == "severe"


@pytest.mark.asyncio
async def test_get_medical_summary_internal(client, mock_internal_key, monkeypatch):
    """Test internal API for AI services."""
    from app.dependencies import auth
    async def mock_verify():
        return True
    monkeypatch.setattr(auth, "verify_internal_api_key", mock_verify)
    
    response = await client.get(
        "/internal/profile/patient/550e8400-e29b-41d4-a716-446655440000/summary",
        headers={"X-Internal-API-Key": mock_internal_key},
    )
    
    # Should be 404 since no profile exists
    assert response.status_code == 404