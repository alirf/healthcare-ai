"""Pydantic schemas for patient profiles."""
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PatientProfileBase(BaseModel):
    """Base patient profile fields."""
    
    full_name: str = Field(..., min_length=2, max_length=100)
    birth_date: date
    gender: Literal["male", "female", "other", "prefer_not_to_say"]
    height_cm: Optional[int] = Field(None, ge=30, le=300)
    weight_kg: Optional[int] = Field(None, ge=1, le=500)
    blood_type: Optional[Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]] = None
    phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, v: str) -> str:
        return v.strip()


class PatientProfileCreate(PatientProfileBase):
    """Schema for creating a patient profile."""
    pass


class PatientProfileUpdate(BaseModel):
    """Schema for updating a patient profile (all fields optional)."""
    
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    birth_date: Optional[date] = None
    gender: Optional[Literal["male", "female", "other", "prefer_not_to_say"]] = None
    height_cm: Optional[int] = Field(None, ge=30, le=300)
    weight_kg: Optional[int] = Field(None, ge=1, le=500)
    blood_type: Optional[Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]] = None
    phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)


class PatientProfileResponse(PatientProfileBase):
    """Schema for patient profile response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    user_id: UUID
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    allergies: List["AllergyResponse"] = []
    medications: List["MedicationResponse"] = []
    conditions: List["ConditionResponse"] = []


# ============ Allergy Schemas ============

class AllergyBase(BaseModel):
    """Base allergy fields."""
    
    allergy_name: str = Field(..., min_length=1, max_length=100)
    severity: Literal["mild", "moderate", "severe", "life_threatening"]
    reaction_description: Optional[str] = None
    diagnosed_at: Optional[date] = None

    @field_validator("allergy_name")
    @classmethod
    def strip_allergy_name(cls, v: str) -> str:
        return v.strip()


class AllergyCreate(AllergyBase):
    """Schema for creating an allergy."""
    pass


class AllergyUpdate(BaseModel):
    """Schema for updating an allergy."""
    
    allergy_name: Optional[str] = Field(None, min_length=1, max_length=100)
    severity: Optional[Literal["mild", "moderate", "severe", "life_threatening"]] = None
    reaction_description: Optional[str] = None
    diagnosed_at: Optional[date] = None


class AllergyResponse(AllergyBase):
    """Schema for allergy response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    created_at: datetime


# ============ Medication Schemas ============

class MedicationBase(BaseModel):
    """Base medication fields."""
    
    medication_name: str = Field(..., min_length=1, max_length=150)
    dosage: Optional[str] = Field(None, max_length=50)
    frequency: Optional[str] = Field(None, max_length=50)
    prescribed_by: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("medication_name")
    @classmethod
    def strip_medication_name(cls, v: str) -> str:
        return v.strip()


class MedicationCreate(MedicationBase):
    """Schema for creating a medication."""
    pass


class MedicationUpdate(BaseModel):
    """Schema for updating a medication."""
    
    medication_name: Optional[str] = Field(None, min_length=1, max_length=150)
    dosage: Optional[str] = Field(None, max_length=50)
    frequency: Optional[str] = Field(None, max_length=50)
    prescribed_by: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class MedicationResponse(MedicationBase):
    """Schema for medication response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ============ Condition Schemas ============

class ConditionBase(BaseModel):
    """Base condition fields."""
    
    condition_name: str = Field(..., min_length=1, max_length=150)
    icd10_code: Optional[str] = Field(None, max_length=10)
    diagnosed_at: Optional[date] = None
    severity: Literal["mild", "moderate", "severe"]
    notes: Optional[str] = None

    @field_validator("condition_name")
    @classmethod
    def strip_condition_name(cls, v: str) -> str:
        return v.strip()


class ConditionCreate(ConditionBase):
    """Schema for creating a condition."""
    pass


class ConditionUpdate(BaseModel):
    """Schema for updating a condition."""
    
    condition_name: Optional[str] = Field(None, min_length=1, max_length=150)
    icd10_code: Optional[str] = Field(None, max_length=10)
    diagnosed_at: Optional[date] = None
    severity: Optional[Literal["mild", "moderate", "severe"]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ConditionResponse(ConditionBase):
    """Schema for condition response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime


# ============ Internal API Schemas ============

class MedicalSummaryResponse(BaseModel):
    """Condensed medical summary for AI Triage and Symptom Intake services.
    
    This is automatically provided at the start of each consultation
    so the patient does not have to re-enter known information.
    """
    
    user_id: UUID
    full_name: str
    age: int
    gender: str
    bmi: Optional[float] = None
    blood_type: Optional[str] = None
    allergies: List[Dict[str, Any]] = []
    current_medications: List[Dict[str, Any]] = []
    chronic_conditions: List[Dict[str, Any]] = []

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "full_name": "John Doe",
                "age": 35,
                "gender": "male",
                "bmi": 24.5,
                "blood_type": "O+",
                "allergies": [
                    {"name": "Penicillin", "severity": "severe"}
                ],
                "current_medications": [
                    {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"}
                ],
                "chronic_conditions": [
                    {"name": "Hypertension", "severity": "moderate"}
                ]
            }
        }
    )


class AvatarResponse(BaseModel):
    """Response schema for avatar upload."""
    
    profile_image_url: str


class ProfileExistsResponse(BaseModel):
    """Response schema for profile existence check."""
    
    exists: bool