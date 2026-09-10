"""Pydantic schemas for symptoms, AI suggestions and prescriptions."""
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ============ Symptom Schemas ============

class SymptomCreate(BaseModel):
    """Manually selected by the patient."""
    symptom_name: str = Field(..., min_length=1, max_length=150)
    severity: Optional[Literal["mild", "moderate", "severe"]] = None
    body_part: Optional[str] = Field(None, max_length=100)
    onset_at: Optional[datetime] = None
    duration_description: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

    @field_validator("symptom_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class SymptomResponse(SymptomCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    source: str                      # manual | ai
    confidence: Optional[float] = None
    ai_model_version: Optional[str] = None
    doctor_confirmed: bool = False
    created_at: datetime
    updated_at: datetime


class AISymptomInput(BaseModel):
    """Detected by the AI symptom-extraction service."""
    symptom_name: str = Field(..., min_length=1, max_length=150)
    severity: Optional[Literal["mild", "moderate", "severe"]] = None
    body_part: Optional[str] = Field(None, max_length=100)
    onset_at: Optional[datetime] = None
    duration_description: Optional[str] = Field(None, max_length=100)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    notes: Optional[str] = None

    @field_validator("symptom_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class AISymptomsBulkInput(BaseModel):
    symptoms: List[AISymptomInput]
    model_version: Optional[str] = Field(None, max_length=50)


# ============ AI Disease Suggestion Schemas ============

class DiseaseSuggestionInput(BaseModel):
    disease_name: str = Field(..., min_length=1, max_length=150)
    icd10_code: Optional[str] = Field(None, max_length=10)
    probability: float = Field(..., ge=0, le=1)
    rank: int = Field(0, ge=0)
    rationale: Optional[str] = None

    @field_validator("disease_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class DiseaseSuggestionsBulkInput(BaseModel):
    suggestions: List[DiseaseSuggestionInput]
    model_version: Optional[str] = Field(None, max_length=50)


class DiseaseSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    disease_name: str
    icd10_code: Optional[str] = None
    probability: float
    rank: int
    rationale: Optional[str] = None
    model_version: Optional[str] = None
    doctor_decision: str           # pending | accepted | rejected
    decided_by: Optional[UUID] = None
    decided_at: Optional[datetime] = None
    created_at: datetime


class SuggestionDecisionInput(BaseModel):
    decision: Literal["accepted", "rejected"]


# ============ Prescription Schemas ============

class PrescriptionItemInput(BaseModel):
    drug_name: str = Field(..., min_length=1, max_length=150)
    dosage: Optional[str] = Field(None, max_length=50)
    frequency: Optional[str] = Field(None, max_length=50)
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    quantity: Optional[str] = Field(None, max_length=50)
    instructions: Optional[str] = None

    @field_validator("drug_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class AIPrescriptionDraftInput(BaseModel):
    items: List[PrescriptionItemInput] = Field(..., min_length=1)
    ai_notes: Optional[str] = None
    model_version: Optional[str] = Field(None, max_length=50)


class AIPrescriptionDraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    items: List[dict] = []
    ai_notes: Optional[str] = None
    model_version: Optional[str] = None
    status: str                    # draft | superseded
    created_at: datetime
    updated_at: datetime


class FinalPrescriptionCreate(BaseModel):
    diagnosis_text: Optional[str] = None
    notes: Optional[str] = None
    items: List[PrescriptionItemInput] = []


class PrescriptionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prescription_id: UUID
    drug_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    quantity: Optional[str] = None
    instructions: Optional[str] = None
    sort_order: int


class FinalPrescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    visit_id: UUID
    doctor_id: UUID
    diagnosis_text: Optional[str] = None
    notes: Optional[str] = None
    issued_at: datetime
    created_at: datetime
    items: List[PrescriptionItemResponse] = []
