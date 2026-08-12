"""Pydantic schemas for doctor profiles."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DoctorProfileBase(BaseModel):
    """Base doctor profile fields."""
    
    full_name: str = Field(..., min_length=2, max_length=100)
    specialty: str = Field(..., min_length=1, max_length=100)
    medical_license_number: str = Field(..., min_length=1, max_length=50)
    years_of_experience: Optional[int] = Field(None, ge=0, le=80)
    phone: Optional[str] = Field(None, max_length=20)
    office_address: Optional[str] = None


class DoctorProfileCreate(DoctorProfileBase):
    """Schema for creating a doctor profile."""
    pass


class DoctorProfileUpdate(BaseModel):
    """Schema for updating a doctor profile."""
    
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    specialty: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    office_address: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=80)


class DoctorProfileResponse(DoctorProfileBase):
    """Schema for doctor profile response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    user_id: UUID
    is_verified: bool
    is_active: bool
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime