"""Pydantic schemas for visits and intake messages."""
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ============ Visit Schemas ============

class VisitCreate(BaseModel):
    """Patient starts a new visit (optionally on an existing medical record)."""
    medical_record_id: Optional[UUID] = None
    chief_complaint: Optional[str] = Field(None, max_length=2000)
    patient_notes: Optional[str] = None
    priority: Literal["low", "normal", "high", "emergency"] = "normal"


class VisitStatusUpdate(BaseModel):
    status: Literal[
        "ai_processing", "doctor_assigned", "in_chat",
        "prescription_pending", "completed", "closed", "cancelled",
    ]


class MedicalRecordLink(BaseModel):
    """Used by the medical-record service (later) to link a visit to a record."""
    medical_record_id: UUID


class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    medical_record_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    status: str
    chief_complaint: Optional[str] = None
    patient_notes: Optional[str] = None
    priority: Optional[str] = None
    started_at: datetime
    doctor_joined_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class VisitListResponse(BaseModel):
    total: int
    visits: List[VisitResponse]


# ============ Intake Message Schemas ============

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    sender_type: str
    message_type: str
    content: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_content_type: Optional[str] = None
    attachment_size: Optional[int] = None
    attachment_url: Optional[str] = None
    sequence: int
    sent_at: datetime
