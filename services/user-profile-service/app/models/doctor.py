import uuid
from datetime import datetime

from sqlalchemy import String, SmallInteger, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DoctorProfile(Base):
    """Doctor profile containing professional information."""
    
    __tablename__ = "doctor_profiles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    medical_license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    license_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    license_verified_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    
    # Professional info (stored as JSON strings)
    education: Mapped[str | None] = mapped_column(Text)
    years_of_experience: Mapped[int | None] = mapped_column(SmallInteger)
    hospital_affiliations: Mapped[str | None] = mapped_column(Text)
    
    # Contact
    phone: Mapped[str | None] = mapped_column(String(20))
    office_address: Mapped[str | None] = mapped_column(Text)
    
    # Media
    profile_image_url: Mapped[str | None] = mapped_column(Text)
    profile_image_key: Mapped[str | None] = mapped_column(Text)
    
    # Status
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )