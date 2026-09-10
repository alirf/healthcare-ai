"""Models for medical records, record-visit links and record files."""
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MedicalRecord(Base):
    """A long-running medical record for a patient.

    Example: the patient had a heart attack -> one record of type heart_attack
    is opened. The patient is visited by several doctors on this same record,
    and comes back months later for a new visit on the very same record.
    """

    __tablename__ = "medical_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    record_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # heart_attack / diabetes / hypertension / general / ...

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    icd10_code: Mapped[Optional[str]] = mapped_column(String(10))

    # active / archived / closed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    visits: Mapped[List["RecordVisit"]] = relationship(
        back_populates="record", cascade="all, delete-orphan", lazy="selectin"
    )
    files: Mapped[List["RecordFile"]] = relationship(
        back_populates="record", cascade="all, delete-orphan", lazy="selectin"
    )


class RecordVisit(Base):
    """Junction between a medical record and a visit.

    Visits live in the visit-intake-service (separate database), so the visit
    reference is a plain UUID — no cross-database foreign key.
    """

    __tablename__ = "record_visits"
    __table_args__ = (
        UniqueConstraint("record_id", "visit_id", name="uq_record_visit"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    added_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    record: Mapped["MedicalRecord"] = relationship(back_populates="visits")


class RecordFile(Base):
    """An attachment of a medical record (lab result, image, ...).

    File bytes live in MinIO (bucket: medical-records); only metadata + key here.
    """

    __tablename__ = "record_files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False, index=True
    )

    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(nullable=False)
    object_key: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    record: Mapped["MedicalRecord"] = relationship(back_populates="files")
