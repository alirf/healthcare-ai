import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Visit(Base):
    """A single consultation session.

    A patient may have many visits. Several visits can belong to one medical
    record (e.g. heart-attack record), managed later by the medical-record
    service - here we only keep the reference (medical_record_id).
    """

    __tablename__ = "visits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    # Reference to the medical-record service (separate DB -> plain UUID, no FK)
    medical_record_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    # Assigned doctor (null until a doctor claims the visit from the queue)
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    # intake -> ai_processing -> doctor_assigned -> in_chat -> prescription_pending
    #   -> completed -> closed   (cancelled possible from early states)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="intake", index=True)

    chief_complaint: Mapped[Optional[str]] = mapped_column(Text)   # main reason of visit
    patient_notes: Mapped[Optional[str]] = mapped_column(Text)
    priority: Mapped[Optional[str]] = mapped_column(String(20))    # low / normal / high / emergency

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    doctor_joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    messages: Mapped[List["VisitMessage"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", lazy="selectin"
    )
    symptoms: Mapped[List["VisitSymptom"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", lazy="selectin"
    )
    disease_suggestions: Mapped[List["AIDiseaseSuggestion"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", lazy="selectin"
    )
    prescription_drafts: Mapped[List["AIPrescriptionDraft"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", lazy="selectin"
    )
    chat_messages: Mapped[List["ChatMessage"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", lazy="selectin"
    )
    final_prescription: Mapped[Optional["FinalPrescription"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", uselist=False, lazy="selectin"
    )
