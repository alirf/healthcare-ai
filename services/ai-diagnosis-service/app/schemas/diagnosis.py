"""Diagnosis request/response schemas."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class DiagnosisRequest(BaseModel):
    """POST /diagnose request body.

    evidence_ids: list of evidence codes detected by ai-nlp-service (ParsBERT)
    patient_sex:  "M" or "F" — the ML model uses this as its 1243rd feature
    patient_age:  optional age in years — used for rule-based age filtering
    top_k:        how many top diseases to return (default 10)
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
    patient_age: Optional[int] = Field(
        default=None,
        ge=0,
        le=150,
        description="Patient age in years — used for rule-based age filtering",
    )
    top_k: int = Field(default=10, ge=1, le=50)


class MatchedEvidence(BaseModel):
    """One evidence that contributed to a disease's rule-based score."""

    evidence_id: str
    weight: float
    evidence_class: str   # cardinal | major | minor
    name_fa: Optional[str] = None


class DiseasePrediction(BaseModel):
    """One predicted disease with probability and metadata."""

    disease_id: str                              # e.g. "D_04_0010"
    disease_name_fa: str                         # e.g. "تانسیلیت"
    disease_name_en: str                         # e.g. "Tonsillitis"
    icd10: Optional[str] = None                  # e.g. "J03.9"
    ml_probability: float                        # raw ML model probability (0-1)
    rule_score: float                            # rule-based score (0-1)
    combined_score: float                        # weighted combination
    is_emergency: bool = False
    severity: int = 1                            # 1-5
    matched_evidences: List[MatchedEvidence] = []
    absent_evidences: List[MatchedEvidence] = []  # evidences that should be absent


class DiagnosisResponse(BaseModel):
    """POST /diagnose response."""

    predictions: List[DiseasePrediction]
    input_evidence_count: int
    patient_sex: str
    model_version: str
    inference_time_ms: float
    rule_engine_version: str


class ModelInfo(BaseModel):
    """GET /model-info response."""

    model_config = ConfigDict(extra="ignore")

    model_type: str
    model_path: str
    diseases_path: str
    classes_count: int
    features_count: int
    disease_registry_count: int
    loaded_at: Optional[str] = None
