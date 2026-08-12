"""Internal API endpoints for service-to-service communication.

These endpoints are NOT exposed through the API Gateway.
They are only accessible directly between microservices.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import verify_internal_api_key
from app.schemas.patient import MedicalSummaryResponse, ProfileExistsResponse
from app.schemas.doctor import DoctorProfileResponse
from app.services.profile_service import ProfileService
from app.exceptions import ProfileNotFoundError

router = APIRouter(prefix="/internal/profile", tags=["Internal"])


@router.get(
    "/patient/{user_id}/summary",
    response_model=MedicalSummaryResponse,
    summary="Get patient medical summary",
    description="""
    Get condensed medical summary for AI Triage and Symptom Intake services.
    
    This endpoint is called automatically at the start of each consultation
    so the patient does not have to re-enter known information.
    
    Returns:
        - Basic demographics (name, age, gender)
        - BMI (computed from height/weight)
        - Blood type
        - All allergies
        - Active medications only
        - Active chronic conditions only
    """,
)
async def get_patient_summary(
    user_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Get medical summary for AI services."""
    service = ProfileService(db)
    summary = await service.get_medical_summary(user_id)
    
    if not summary:
        raise ProfileNotFoundError()
    
    return summary


@router.get(
    "/patient/{user_id}/exists",
    response_model=ProfileExistsResponse,
    summary="Check if patient profile exists",
)
async def check_patient_exists(
    user_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Quick check if patient has completed profile setup."""
    service = ProfileService(db)
    exists = await service.patient_profile_exists(user_id)
    return ProfileExistsResponse(exists=exists)


@router.get(
    "/doctor/{user_id}",
    response_model=DoctorProfileResponse,
    summary="Get doctor profile by ID",
)
async def get_doctor_by_id(
    user_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Get doctor profile for appointment scheduling or display."""
    service = ProfileService(db)
    profile = await service.get_doctor_profile(user_id)
    
    if not profile:
        raise ProfileNotFoundError()
    
    return profile