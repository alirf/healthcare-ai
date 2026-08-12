import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, Date, SmallInteger, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PatientProfile(Base):
    """Patient profile containing basic and health information."""
    
    __tablename__ = "patient_profiles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    birth_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    gender: Mapped[str | None] = mapped_column(String(10))
    height_cm: Mapped[int | None] = mapped_column(SmallInteger)
    weight_kg: Mapped[int | None] = mapped_column(SmallInteger)
    blood_type: Mapped[str | None] = mapped_column(String(5))
    phone: Mapped[str | None] = mapped_column(String(20))
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20))
    profile_image_url: Mapped[str | None] = mapped_column(Text)
    profile_image_key: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    allergies: Mapped[List["PatientAllergy"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", lazy="selectin"
    )
    medications: Mapped[List["PatientMedication"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", lazy="selectin"
    )
    conditions: Mapped[List["PatientChronicCondition"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan", lazy="selectin"
    )


class PatientAllergy(Base):
    """Patient allergy record."""
    
    __tablename__ = "patient_allergies"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patient_profiles.user_id", ondelete="CASCADE"), nullable=False
    )
    allergy_name: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str | None] = mapped_column(String(20))
    reaction_description: Mapped[str | None] = mapped_column(Text)
    diagnosed_at: Mapped[datetime | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    patient: Mapped["PatientProfile"] = relationship(back_populates="allergies")


class PatientMedication(Base):
    """Patient current medication record."""
    
    __tablename__ = "patient_current_medications"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patient_profiles.user_id", ondelete="CASCADE"), nullable=False
    )
    medication_name: Mapped[str] = mapped_column(String(150), nullable=False)
    dosage: Mapped[str | None] = mapped_column(String(50))
    frequency: Mapped[str | None] = mapped_column(String(50))
    prescribed_by: Mapped[str | None] = mapped_column(String(100))
    start_date: Mapped[datetime | None] = mapped_column(Date)
    end_date: Mapped[datetime | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    patient: Mapped["PatientProfile"] = relationship(back_populates="medications")


class PatientChronicCondition(Base):
    """Patient chronic condition record."""
    
    __tablename__ = "patient_chronic_conditions"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patient_profiles.user_id", ondelete="CASCADE"), nullable=False
    )
    condition_name: Mapped[str] = mapped_column(String(150), nullable=False)
    icd10_code: Mapped[str | None] = mapped_column(String(10))
    diagnosed_at: Mapped[datetime | None] = mapped_column(Date)
    severity: Mapped[str | None] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    patient: Mapped["PatientProfile"] = relationship(back_populates="conditions")