"""Diagnosis schemas — visit-intake-service side.

These mirror what ai-triage-service returns from POST /visits/{id}/diagnose
plus the persistence layer (id, visit_id, created_at) we add when storing
the predictions in visits_db.

Also defines FinalDiagnosisRequest / FinalDiagnosisResponse — the doctor's
final decision (chosen disease + ICD-10 + notes), submitted when the
visit is closed.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ──────────────────────────────────────────────────────────────────────
# Mirror of ai-triage-service diagnosis schemas (tolerant client view)
# ──────────────────────────────────────────────────────────────────────

class MatchedEvidence(BaseModel):
    """One evidence that contributed to a disease's rule-based score."""

    model_config = ConfigDict(extra="ignore")

    evidence_id: str
    weight: float
    evidence_class: str   # cardinal | major | minor
    name_fa: Optional[str] = None


class DiseasePrediction(BaseModel):
    """One predicted disease with probability and metadata."""

    model_config = ConfigDict(extra="ignore")

    disease_id: str
    disease_name_fa: str
    disease_name_en: str
    icd10: Optional[str] = None
    ml_probability: float
    rule_score: float
    combined_score: float
    is_emergency: bool = False
    severity: int = 1
    matched_evidences: List[MatchedEvidence] = []
    absent_evidences: List[MatchedEvidence] = []


class DiagnosisTriggerRequest(BaseModel):
    """Body of POST /visits/{visit_id}/diagnose (doctor triggers AI diagnosis).

    All fields optional — by default ai-triage-service:
      1. Fetches visit context (this same service)
      2. Resolves evidence_ids from stored AI symptoms
      3. Falls back to re-extracting from patient text
      4. Resolves patient_sex from visit context
    """

    patient_sex: Optional[str] = Field(
        default=None,
        pattern="^(M|F|m|f)$",
        description="Override patient sex. If omitted, fetched from visit context.",
    )
    patient_age: Optional[int] = Field(default=None, ge=0, le=150)
    top_k: Optional[int] = Field(default=None, ge=1, le=50)
    reextract: bool = Field(
        default=False,
        description="If true, re-run ParsBERT on patient text instead of using stored AI symptoms.",
    )


class AIDiagnosisSuggestion(BaseModel):
    """One stored AI diagnosis suggestion (a single disease prediction)."""

    id: str                              # UUID of the row in ai_diagnosis_suggestions
    disease_id: str
    disease_name_fa: str
    disease_name_en: str
    icd10: Optional[str] = None
    ml_probability: float
    rule_score: float
    combined_score: float
    is_emergency: bool = False
    severity: int = 1
    matched_evidences: List[MatchedEvidence] = []
    absent_evidences: List[MatchedEvidence] = []
    rank: int                            # 1-based rank in the suggestions list


class AIDiagnosisResponse(BaseModel):
    """Response of GET /visits/{visit_id}/ai-diagnosis and POST /visits/{id}/diagnose."""

    visit_id: UUID
    suggestions: List[AIDiagnosisSuggestion]
    evidence_source: str                 # stored_ai_symptoms | reextracted
    patient_sex: str
    model_version: str
    rule_engine_version: str
    diagnosed_at: datetime
    input_evidence_count: int


# ──────────────────────────────────────────────────────────────────────
# Final diagnosis (doctor's decision)
# ──────────────────────────────────────────────────────────────────────

class FinalDiagnosisRequest(BaseModel):
    """Body of POST /visits/{visit_id}/final-diagnosis.

    The doctor can either:
      - pick one of the AI suggestions (selected_suggestion_id)
      - enter a manual diagnosis (manual_disease_name + manual_icd10)
    At least one of the two must be provided. Notes are free-text (Persian).
    """

    selected_suggestion_id: Optional[str] = Field(
        default=None,
        description="ID of the AI suggestion the doctor accepts. Mutually exclusive with manual_*.",
    )
    manual_disease_name: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Free-text disease name (used when the doctor overrides the AI suggestions).",
    )
    manual_icd10: Optional[str] = Field(
        default=None,
        max_length=20,
        description="ICD-10 code for the manual diagnosis (e.g. J03.9).",
    )
    notes: str = Field(
        default="",
        max_length=4000,
        description="Doctor's free-text explanation / prescription summary (Persian).",
    )
    requires_follow_up: bool = False
    follow_up_days: Optional[int] = Field(default=None, ge=1, le=365)


class FinalDiagnosisResponse(BaseModel):
    """Response of POST /visits/{visit_id}/final-diagnosis and
    GET /visits/{visit_id}/final-diagnosis (patient view)."""

    id: str
    visit_id: UUID
    disease_name_fa: str
    disease_name_en: Optional[str] = None
    icd10: Optional[str] = None
    disease_id: Optional[str] = None      # null for manual entries
    selected_suggestion_id: Optional[str] = None
    notes: str
    requires_follow_up: bool
    follow_up_days: Optional[int] = None
    doctor_id: str
    created_at: datetime
    visit_status: str                     # reflects the new visit status after submission
