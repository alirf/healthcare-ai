"""Request/response contracts for the NLP inference API."""
from typing import Any, Dict, List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ExtractRequest(BaseModel):
    """POST /extract request body."""

    text: str = Field(
        ...,
        description="Persian free text. Inputs longer than 5000 chars are truncated.",
    )
    threshold: Optional[float] = Field(
        default=None,
        gt=0.0,
        le=1.0,
        description="Detection threshold; defaults to settings.THRESHOLD when omitted.",
    )
    top_k: Optional[int] = Field(
        default=None,
        ge=1,
        description="Return only the K most confident evidences (after filtering).",
    )
    apply_hierarchy_filter: bool = Field(
        default=True,
        description="Drop child evidences whose parent evidence was not detected.",
    )


class DetectedEvidence(BaseModel):
    """One detected evidence with its probability and pass-through metadata.

    `value_meaning`, `possible-values` and `default_value` are passed through
    untouched for the follow-up questioning step — this service never
    interprets them.
    """

    model_config = ConfigDict(populate_by_name=True)

    evidence_id: str
    name: str
    name_fa: Optional[str] = None
    question_en: Optional[str] = None
    question_fa: Optional[str] = None
    data_type: Optional[str] = None
    is_antecedent: Optional[bool] = None
    code_question: Optional[str] = None
    default_value: Optional[Any] = None
    value_meaning: Optional[Dict[str, Any]] = None
    # The source JSON key is "possible-values" (hyphenated); keep the original
    # key in responses for faithful pass-through.
    possible_values: Optional[List[Any]] = Field(
        default=None,
        validation_alias=AliasChoices("possible-values", "possible_values"),
        serialization_alias="possible-values",
    )
    confidence: float


class ExtractResponse(BaseModel):
    """POST /extract response body."""

    text: str
    detected: List[DetectedEvidence]
    threshold: float
    apply_hierarchy_filter: bool
    truncated: bool
    model_version: str
    inference_time_ms: float


class ModelInfo(BaseModel):
    """GET /model-info response body."""

    model_name: str
    checkpoint_path: str
    evidence_path: str
    model_version: str
    evidence_count: int
    threshold_default: float
    max_len: int
    device: str
    training_f1: Optional[float] = None
    training_epoch: Optional[int] = None
    loaded_at: Optional[str] = None


class HealthResponse(BaseModel):
    """GET /health response body."""

    status: str
    model_loaded: bool
    device: Optional[str] = None
    evidence_count: Optional[int] = None
    error: Optional[str] = None
