"""Pydantic schemas for doctor-patient chat."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    sender_id: UUID
    sender_role: str   # doctor | patient
    content: str
    sent_at: datetime
