"""Doctor-facing medical record endpoints (minimal)."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.exceptions import MedicalRecordNotFoundError, ForbiddenAccessError
from app.schemas.record import MedicalRecordResponse, MedicalRecordDetailResponse, RecordVisitResponse
from app.services.record_service import MedicalRecordService

router = APIRouter(prefix="/doctor/records", tags=["Doctor Medical Records"])


def get_user_id(current_user: dict) -> UUID:
    return UUID(current_user["sub"])


@router.get("", response_model=List[MedicalRecordResponse])
async def list_doctor_records(
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Medical records of patients this doctor has treated (via visit-intake).

    Read-only and minimal by design — doctors see the record header, not
    necessarily every other doctor's full visit details.
    """
    service = MedicalRecordService(db)
    return await service.list_doctor_records(get_user_id(current_user))


@router.get("/{record_id}", response_model=MedicalRecordDetailResponse)
async def get_record_for_doctor(
    record_id: UUID,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Record header + linked visits (if doctor treated this patient)."""
    service = MedicalRecordService(db)
    record = await service.get_record_or_404(record_id)
    treated_patient_ids = {
        r.patient_id for r in await service.list_doctor_records(get_user_id(current_user))
    }
    if record.patient_id not in treated_patient_ids:
        raise ForbiddenAccessError("You have no visit assigned to this patient")
    return MedicalRecordDetailResponse.model_validate(record)
