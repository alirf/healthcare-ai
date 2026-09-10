"""Pydantic schemas for medical records."""
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ============ Medical Record Schemas ============

class MedicalRecordCreate(BaseModel):
    """Patient opens a new medical record."""
    record_type: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    icd10_code: Optional[str] = Field(None, max_length=10)

    @field_validator("record_type", "title")
    @classmethod
    def strip_values(cls, v: str) -> str:
        return v.strip()


class MedicalRecordUpdate(BaseModel):
    """Partial update of a medical record."""
    record_type: Optional[str] = Field(None, min_length=1, max_length=50)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    icd10_code: Optional[str] = Field(None, max_length=10)


class MedicalRecordStatusUpdate(BaseModel):
    status: Literal["active", "archived", "closed"]


class RecordVisitResponse(BaseModel):
    """A visit linked to the record (visit details live in visit-intake-service)."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    record_id: UUID
    visit_id: UUID
    added_by: UUID
    added_at: datetime


class MedicalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    record_type: str
    title: str
    description: Optional[str] = None
    icd10_code: Optional[str] = None
    status: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class MedicalRecordDetailResponse(MedicalRecordResponse):
    """Record with its linked visits and files."""
    visits: List[RecordVisitResponse] = []
    files: List["RecordFileResponse"] = []


class MedicalRecordListResponse(BaseModel):
    total: int
    records: List[MedicalRecordResponse]


# ============ Record File Schemas ============

class RecordFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    record_id: UUID
    uploaded_by: UUID
    file_name: str
    content_type: str
    size: int
    description: Optional[str] = None
    file_url: Optional[str] = None   # fresh presigned URL (generated on read)
    created_at: datetime


class RecordFileUploadResponse(RecordFileResponse):
    pass


# ============ Internal API Schemas ============

class VisitLinkRequest(BaseModel):
    """visit-intake-service asks us to register one of its visits on a record."""
    visit_id: UUID
    patient_id: UUID            # must match the record owner
    added_by: Optional[UUID] = None


class RecordExistsResponse(BaseModel):
    exists: bool


# resolve forward reference
MedicalRecordDetailResponse.model_rebuild()
