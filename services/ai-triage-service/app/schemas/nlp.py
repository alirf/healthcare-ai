"""Schemas mirroring the ai-nlp-service POST /extract contract.

These are deliberately tolerant (extra="ignore") so a small change on the
ai-nlp-service side can never break the triage orchestrator.
"""
from typing import Any, Dict, List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class DetectedEvidence(BaseModel):
    """One evidence detected by ai-nlp-service."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

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
    possible_values: Optional[List[Any]] = Field(
        default=None,
        validation_alias=AliasChoices("possible-values", "possible_values"),
        serialization_alias="possible-values",
    )
    confidence: float = 0.0


class ExtractRequest(BaseModel):
    """Body of POST /extract-evidences (mirrors ai-nlp-service /extract)."""

    text: str = Field(..., min_length=1, max_length=5000)
    threshold: Optional[float] = Field(default=None, gt=0.0, le=1.0)
    top_k: Optional[int] = Field(default=None, ge=1)
    apply_hierarchy_filter: bool = True


class ExtractResponse(BaseModel):
    """Response of POST /extract-evidences (passthrough of ai-nlp-service)."""

    text: str
    detected: List[DetectedEvidence] = []
    threshold: float
    apply_hierarchy_filter: bool
    truncated: bool
    model_version: str
    inference_time_ms: float


class ModelInfo(BaseModel):
    """GET /model-info response (passthrough)."""

    model_config = ConfigDict(extra="ignore")

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
    """GET /health response — ai-triage-service's own health (not the model's)."""

    status: str                                  # healthy | degraded
    nlp_service: Optional[str] = None             # reachable | unreachable
    diagnosis_service: Optional[str] = None       # reachable | unreachable
    error: Optional[str] = None
