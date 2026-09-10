"""Internal API endpoints for service-to-service communication.

NOT exposed through the API Gateway (gateway blocks /internal/* paths).
Called by visit-intake-service and other backend services with X-Internal-API-Key.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import verify_internal_api_key
from app.exceptions import ForbiddenAccessError, MedicalRecordNotFoundError
from app.schemas.record import (
    MedicalRecordResponse,
    RecordVisitResponse,
    VisitLinkRequest,
    RecordExistsResponse,
)
from app.services.record_service import MedicalRecordService

router = APIRouter(prefix="/internal/records", tags=["Internal"])


@router.get("/patient/{patient_id}", response_model=dict)
async def get_patient_records(
    patient_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """All medical records of a patient (used by AI/frontend services)."""
    service = MedicalRecordService(db)
    records = await service.list_patient_records(patient_id)
    return {
        "exists": len(records) > 0,
        "total": len(records),
        "records": [MedicalRecordResponse.model_validate(r).model_dump(mode="json") for r in records],
    }


@router.get("/patient/{patient_id}/exists", response_model=RecordExistsResponse)
async def check_patient_records(
    patient_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Quick existence check for a patient's medical records."""
    service = MedicalRecordService(db)
    exists = await service.record_exists_for_patient(patient_id)
    return RecordExistsResponse(exists=exists)


@router.get("/{record_id}/exists", response_model=RecordExistsResponse)
async def check_record_exists(
    record_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Check that a specific medical record exists."""
    service = MedicalRecordService(db)
    try:
        await service.get_record_or_404(record_id)
        return RecordExistsResponse(exists=True)
    except MedicalRecordNotFoundError:
        return RecordExistsResponse(exists=False)


@router.get("/{record_id}/visits", response_model=List[RecordVisitResponse])
async def list_record_visits(
    record_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Visits linked to a record (visit details must be fetched from visit-intake)."""
    service = MedicalRecordService(db)
    await service.get_record_or_404(record_id)
    return await service.list_record_visits(record_id)


@router.post("/{record_id}/visits", response_model=RecordVisitResponse, status_code=status.HTTP_201_CREATED)
async def link_visit_to_record(
    record_id: UUID,
    payload: VisitLinkRequest,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Register a visit (from visit-intake-service) on this medical record.

    The caller must prove the visit belongs to the same patient as the record
    by passing the visit's patient_id.
    """
    service = MedicalRecordService(db)
    record = await service.get_record_or_404(record_id)
    if record.patient_id != payload.patient_id:
        raise ForbiddenAccessError("Visit patient does not match the record owner")

    added_by = payload.added_by or payload.patient_id
    return await service.link_visit(record, payload.visit_id, added_by)
