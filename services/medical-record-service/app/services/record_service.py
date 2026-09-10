"""Business logic for medical records, record-visit links and record files."""
from datetime import datetime
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.record import MedicalRecord, RecordVisit, RecordFile
from app.schemas.record import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
)
from app.exceptions import (
    DuplicateVisitLinkError,
    ForbiddenAccessError,
    InvalidRecordStateError,
    MedicalRecordNotFoundError,
)

# Valid status transitions for a medical record
ALLOWED_STATUS_TRANSITIONS = {
    "active": {"archived", "closed"},
    "archived": {"active", "closed"},
    "closed": set(),  # a closed record stays closed
}


class MedicalRecordService:
    """Service layer for medical record operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================================================================
    # RECORD CRUD
    # =====================================================================

    async def create_record(self, patient_id: UUID, data: MedicalRecordCreate) -> MedicalRecord:
        record = MedicalRecord(patient_id=patient_id, **data.model_dump())
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_record(self, record_id: UUID) -> Optional[MedicalRecord]:
        """Get a record with visits and files eagerly loaded."""
        result = await self.db.execute(
            select(MedicalRecord)
            .options(
                selectinload(MedicalRecord.visits),
                selectinload(MedicalRecord.files),
            )
            .where(MedicalRecord.id == record_id)
        )
        return result.scalar_one_or_none()

    async def get_record_or_404(self, record_id: UUID) -> MedicalRecord:
        record = await self.get_record(record_id)
        if not record:
            raise MedicalRecordNotFoundError()
        return record

    async def list_patient_records(
        self, patient_id: UUID, status: Optional[str] = None
    ) -> list[MedicalRecord]:
        stmt = (
            select(MedicalRecord)
            .where(MedicalRecord.patient_id == patient_id)
            .order_by(MedicalRecord.opened_at.desc())
        )
        if status:
            stmt = stmt.where(MedicalRecord.status == status)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_record(
        self, record: MedicalRecord, data: MedicalRecordUpdate
    ) -> MedicalRecord:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(record, field, value)
        await self.db.flush()
        return record

    async def change_status(self, record: MedicalRecord, new_status: str) -> MedicalRecord:
        allowed = ALLOWED_STATUS_TRANSITIONS.get(record.status, set())
        if new_status not in allowed:
            raise InvalidRecordStateError(
                f"Cannot move medical record from '{record.status}' to '{new_status}'"
            )
        record.status = new_status
        if new_status == "closed":
            record.closed_at = datetime.utcnow()
        await self.db.flush()
        return record

    # =====================================================================
    # OWNERSHIP HELPERS
    # =====================================================================

    async def assert_patient_owner(self, record: MedicalRecord, patient_id: UUID) -> None:
        if record.patient_id != patient_id:
            raise ForbiddenAccessError("This medical record does not belong to you")

    # =====================================================================
    # RECORD <-> VISIT LINKS (junction, visits live in another database)
    # =====================================================================

    async def link_visit(
        self, record: MedicalRecord, visit_id: UUID, added_by: UUID
    ) -> RecordVisit:
        # The visit belongs to another service/database — verify ownership
        # via the patient_id the caller passes (visit-intake enforces it too).
        existing = await self.db.execute(
            select(RecordVisit).where(
                RecordVisit.record_id == record.id,
                RecordVisit.visit_id == visit_id,
            )
        )
        if existing.scalar_one_or_none():
            raise DuplicateVisitLinkError()

        link = RecordVisit(record_id=record.id, visit_id=visit_id, added_by=added_by)
        self.db.add(link)
        await self.db.flush()
        return link

    async def unlink_visit(self, record_id: UUID, visit_id: UUID) -> bool:
        result = await self.db.execute(
            select(RecordVisit).where(
                RecordVisit.record_id == record_id,
                RecordVisit.visit_id == visit_id,
            )
        )
        link = result.scalar_one_or_none()
        if not link:
            return False
        await self.db.delete(link)
        await self.db.flush()
        return True

    async def list_record_visits(self, record_id: UUID) -> list[RecordVisit]:
        result = await self.db.execute(
            select(RecordVisit)
            .where(RecordVisit.record_id == record_id)
            .order_by(RecordVisit.added_at.asc())
        )
        return result.scalars().all()

    async def record_exists_for_patient(self, patient_id: UUID) -> bool:
        result = await self.db.execute(
            select(MedicalRecord.id)
            .where(MedicalRecord.patient_id == patient_id)
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    # =====================================================================
    # RECORD FILES
    # =====================================================================

    async def add_file(
        self,
        record: MedicalRecord,
        uploaded_by: UUID,
        file_name: str,
        content_type: str,
        size: int,
        object_key: str,
        description: Optional[str] = None,
    ) -> RecordFile:
        record_file = RecordFile(
            record_id=record.id,
            uploaded_by=uploaded_by,
            file_name=file_name,
            content_type=content_type,
            size=size,
            object_key=object_key,
            description=description,
        )
        self.db.add(record_file)
        await self.db.flush()
        return record_file

    async def get_file(self, file_id: UUID) -> Optional[RecordFile]:
        result = await self.db.execute(select(RecordFile).where(RecordFile.id == file_id))
        return result.scalar_one_or_none()

    async def list_files(self, record_id: UUID) -> list[RecordFile]:
        result = await self.db.execute(
            select(RecordFile)
            .where(RecordFile.record_id == record_id)
            .order_by(RecordFile.created_at.asc())
        )
        return result.scalars().all()

    async def delete_file(self, record_file: RecordFile) -> None:
        await self.db.delete(record_file)
        await self.db.flush()

    # =====================================================================
    # DOCTOR VIEW (minimal): patients this doctor has treated
    # =====================================================================

    async def list_doctor_records(self, doctor_id: UUID) -> list[MedicalRecord]:
        """Records of patients who have at least one visit assigned to this doctor.

        The list of treated patient IDs comes from visit-intake-service.
        """
        settings = get_settings()
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    f"{settings.VISIT_INTAKE_SERVICE_URL}"
                    f"/internal/intake/doctor/{doctor_id}/patient-ids",
                    headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY},
                )
                resp.raise_for_status()
                patient_ids = [UUID(pid) for pid in resp.json().get("patient_ids", [])]
            except (httpx.HTTPError, ValueError, KeyError):
                return []

        if not patient_ids:
            return []

        result = await self.db.execute(
            select(MedicalRecord)
            .where(MedicalRecord.patient_id.in_(patient_ids))
            .order_by(MedicalRecord.opened_at.desc())
        )
        return result.scalars().all()
