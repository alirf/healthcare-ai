"""Patient-facing medical record endpoints."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.exceptions import (
    MedicalRecordNotFoundError,
    RecordFileNotFoundError,
    ForbiddenAccessError,
)
from app.schemas.record import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
    MedicalRecordDetailResponse,
    MedicalRecordListResponse,
    RecordFileResponse,
    RecordFileUploadResponse,
)
from app.services.record_service import MedicalRecordService
from app.services.storage_service import StorageService

router = APIRouter(prefix="/records", tags=["Medical Records"])


def get_user_id(current_user: dict) -> UUID:
    return UUID(current_user["sub"])


async def get_owned_record(
    record_id: UUID,
    current_user: dict,
    db: AsyncSession,
) -> "MedicalRecordService.get_record_or_404":
    service = MedicalRecordService(db)
    record = await service.get_record_or_404(record_id)
    await service.assert_patient_owner(record, get_user_id(current_user))
    return record


def hydrate_file(storage: StorageService, record_file) -> RecordFileResponse:
    """Attach a fresh presigned URL to a file record."""
    data = RecordFileResponse.model_validate(record_file)
    data.file_url = storage.get_file_url(record_file.object_key)
    return data


# =====================================================================
# RECORD LIFECYCLE
# =====================================================================

@router.post("", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    data: MedicalRecordCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Open a new medical record (e.g. after a heart attack)."""
    service = MedicalRecordService(db)
    return await service.create_record(get_user_id(current_user), data)


@router.get("", response_model=MedicalRecordListResponse)
async def list_my_records(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """List all of the patient's medical records (optionally filtered by status)."""
    service = MedicalRecordService(db)
    records = await service.list_patient_records(get_user_id(current_user), status_filter)
    return MedicalRecordListResponse(total=len(records), records=records)


@router.get("/{record_id}", response_model=MedicalRecordDetailResponse)
async def get_record(
    record_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Record detail with linked visits and files (fresh presigned URLs)."""
    record = await get_owned_record(record_id, current_user, db)
    storage = StorageService()
    detail = MedicalRecordDetailResponse.model_validate(record)
    detail.files = [hydrate_file(storage, f) for f in record.files]
    return detail


@router.put("/{record_id}", response_model=MedicalRecordResponse)
async def update_record(
    record_id: UUID,
    data: MedicalRecordUpdate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Edit title/description/type/icd10 of the patient's record."""
    record = await get_owned_record(record_id, current_user, db)
    service = MedicalRecordService(db)
    return await service.update_record(record, data)


@router.post("/{record_id}/close", response_model=MedicalRecordResponse)
async def close_record(
    record_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Close the record (final state, sets closed_at)."""
    record = await get_owned_record(record_id, current_user, db)
    service = MedicalRecordService(db)
    return await service.change_status(record, "closed")


@router.post("/{record_id}/archive", response_model=MedicalRecordResponse)
async def archive_record(
    record_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Archive the record (reversible via close or reactivation later)."""
    record = await get_owned_record(record_id, current_user, db)
    service = MedicalRecordService(db)
    return await service.change_status(record, "archived")


# =====================================================================
# RECORD FILES
# =====================================================================

@router.post("/{record_id}/files", response_model=RecordFileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    record_id: UUID,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Attach a file to the record (lab result, image, ...). Stored in MinIO."""
    record = await get_owned_record(record_id, current_user, db)

    storage = StorageService()
    meta = await storage.upload_record_file(file, str(record_id), str(get_user_id(current_user)))

    service = MedicalRecordService(db)
    record_file = await service.add_file(
        record,
        uploaded_by=get_user_id(current_user),
        description=description,
        **meta,
    )
    return hydrate_file(storage, record_file)


@router.get("/{record_id}/files", response_model=List[RecordFileResponse])
async def list_files(
    record_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """List record files (URLs are fresh presigned URLs)."""
    record = await get_owned_record(record_id, current_user, db)
    service = MedicalRecordService(db)
    files = await service.list_files(record.id)
    storage = StorageService()
    return [hydrate_file(storage, f) for f in files]


@router.delete("/{record_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    record_id: UUID,
    file_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a record file (removed from MinIO and from the database)."""
    record = await get_owned_record(record_id, current_user, db)
    service = MedicalRecordService(db)
    record_file = await service.get_file(file_id)
    if not record_file or record_file.record_id != record.id:
        raise RecordFileNotFoundError()

    storage = StorageService()
    await storage.delete_file(record_file.object_key)
    await service.delete_file(record_file)
    return None
