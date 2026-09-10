import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String, Text, DateTime, Integer, Float, ForeignKey, UniqueConstraint, JSON,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# JSONB on PostgreSQL, plain JSON on SQLite (for tests)
JsonbCompat = JSON().with_variant(JSONB(astext_type=Text()), "postgresql")


class VisitSymptom(Base):
    """Symptom recorded for a visit - either selected manually by the patient
    or detected automatically by the AI symptom-extraction service."""

    __tablename__ = "visit_symptoms"
    __table_args__ = (
        UniqueConstraint("visit_id", "symptom_name", "source", name="uq_visit_symptom_source"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, index=True
    )

    symptom_name: Mapped[str] = mapped_column(String(150), nullable=False)
    source: Mapped[str] = mapped_column(String(10), nullable=False)  # manual | ai

    severity: Mapped[Optional[str]] = mapped_column(String(20))        # mild | moderate | severe
    body_part: Mapped[Optional[str]] = mapped_column(String(100))
    onset_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_description: Mapped[Optional[str]] = mapped_column(String(100))

    # AI-specific fields
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    ai_model_version: Mapped[Optional[str]] = mapped_column(String(50))
    doctor_confirmed: Mapped[bool] = mapped_column(default=False)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    visit: Mapped["Visit"] = relationship(back_populates="symptoms")


class AIDiseaseSuggestion(Base):
    """Probable diseases suggested by the AI diagnostic service for the doctor."""

    __tablename__ = "ai_disease_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, index=True
    )

    disease_name: Mapped[str] = mapped_column(String(150), nullable=False)
    icd10_code: Mapped[Optional[str]] = mapped_column(String(10))
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, default=0)
    rationale: Mapped[Optional[str]] = mapped_column(Text)

    model_version: Mapped[Optional[str]] = mapped_column(String(50))

    doctor_decision: Mapped[str] = mapped_column(String(20), default="pending")  # pending | accepted | rejected
    decided_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    visit: Mapped["Visit"] = relationship(back_populates="disease_suggestions")


class AIPrescriptionDraft(Base):
    """Prescription draft written by the AI service for the doctor to edit."""

    __tablename__ = "ai_prescription_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, index=True
    )

    items: Mapped[list] = mapped_column(JsonbCompat, nullable=False, default=list)
    ai_notes: Mapped[Optional[str]] = mapped_column(Text)
    model_version: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | superseded

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    visit: Mapped["Visit"] = relationship(back_populates="prescription_drafts")


class FinalPrescription(Base):
    """The final prescription issued by the doctor after editing the AI draft."""

    __tablename__ = "final_prescriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    diagnosis_text: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    visit: Mapped["Visit"] = relationship(back_populates="final_prescription")
    items: Mapped[List["PrescriptionItem"]] = relationship(
        back_populates="prescription", cascade="all, delete-orphan", lazy="selectin"
    )


class PrescriptionItem(Base):
    """A single drug line of a final prescription."""

    __tablename__ = "prescription_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("final_prescriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    drug_name: Mapped[str] = mapped_column(String(150), nullable=False)
    dosage: Mapped[Optional[str]] = mapped_column(String(50))
    frequency: Mapped[Optional[str]] = mapped_column(String(50))
    duration_days: Mapped[Optional[int]] = mapped_column(Integer)
    quantity: Mapped[Optional[str]] = mapped_column(String(50))
    instructions: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    prescription: Mapped["FinalPrescription"] = relationship(back_populates="items")
