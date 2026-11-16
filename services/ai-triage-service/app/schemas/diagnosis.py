"""Diagnosis schemas — mirror ai-diagnosis-service contract.

These are *client-side* views of the diagnosis response: tolerant on
purpose (extra fields ignored, optional fields default to None) so a small
change on ai-diagnosis-service side can never break ai-triage-service.

ai-triage-service forwards these to visit-intake-service untouched.
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


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


class DiagnosisRequest(BaseModel):
    """Body of POST /diagnose (passthrough) and POST /visits/{id}/diagnose.

    For the visit-scoped endpoint, evidence_ids + patient_sex are pulled
    from the visit context — caller can still override top_k.
    """

    evidence_ids: List[str] = Field(
        ...,
        min_length=1,
        description="Evidence codes from ai-nlp-service, e.g. ['E_00_0001', 'E_06_0004']",
    )
    patient_sex: Optional[str] = Field(
        default=None,
        pattern="^(M|F|m|f)$",
        description="Patient sex: M or F. Defaults to M if not provided.",
    )
    patient_age: Optional[int] = Field(default=None, ge=0, le=150)
    top_k: int = Field(default=10, ge=1, le=50)


class DiagnosisResponse(BaseModel):
    """Response of POST /diagnose and POST /visits/{id}/diagnose."""

    model_config = ConfigDict(extra="ignore")

    predictions: List[DiseasePrediction]
    input_evidence_count: int
    patient_sex: str
    model_version: str
    inference_time_ms: float
    rule_engine_version: str


class VisitDiagnosisRequest(BaseModel):
    """Body of POST /visits/{visit_id}/diagnose.

    Optional overrides. By default ai-triage-service:
      1. Fetches visit context from visit-intake-service
      2. Extracts evidence_ids from stored AI symptoms (notes.evidence_id)
      3. Falls back to re-running ParsBERT on patient text if no AI symptoms
      4. Resolves patient_sex from visit context (defaults to M)
      5. Calls ai-diagnosis-service POST /diagnose
    """

    patient_sex: Optional[str] = Field(
        default=None,
        pattern="^(M|F|m|f)$",
        description="Override patient sex. If omitted, fetched from visit context.",
    )
    patient_age: Optional[int] = Field(default=None, ge=0, le=150)
    top_k: int = Field(default=10, ge=1, le=50)
    reextract: bool = Field(
        default=False,
        description="If true, re-run ParsBERT on patient text instead of using stored AI symptoms.",
    )


class VisitDiagnosisResponse(BaseModel):
    """Response of POST /visits/{visit_id}/diagnose.

    Wraps the diagnosis response with visit metadata.
    """

    visit_id: str
    predictions: List[DiseasePrediction]
    input_evidence_count: int
    patient_sex: str
    evidence_source: str   # "stored_ai_symptoms" | "reextracted"
    model_version: str
    inference_time_ms: float
    rule_engine_version: str
    diagnosed_at: str      # ISO 8601 UTC
