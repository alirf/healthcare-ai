"""Pydantic schemas mirroring the ai-nlp-service POST /extract contract.

These are the *client-side* views of the NLP response: tolerant on purpose
(extra fields ignored, optional fields default to None) so a small change on
the ai-nlp-service side can never break visit intake.
"""
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DetectedEvidence(BaseModel):
    """One evidence detected by ai-nlp-service (trimmed client-side view)."""

    model_config = ConfigDict(extra="ignore")

    evidence_id: str
    name: str
    name_fa: Optional[str] = None
    question_en: Optional[str] = None
    question_fa: Optional[str] = None
    data_type: Optional[str] = None
    is_antecedent: Optional[bool] = None
    code_question: Optional[str] = None
    confidence: float = 0.0


class ExtractResult(BaseModel):
    """Trimmed-down mirror of ai-nlp-service's ExtractResponse."""

    model_config = ConfigDict(extra="ignore")

    detected: List[DetectedEvidence] = []
    threshold: Optional[float] = None
    truncated: Optional[bool] = None
    model_version: Optional[str] = None
    inference_time_ms: Optional[float] = None


class ExtractPreviewRequest(BaseModel):
    """Body of POST /extract-evidences-preview.

    Allows the frontend chat to ask ai-nlp-service for evidence detection on
    free text WITHOUT creating a visit first. Threshold is optional and falls
    back to the service default (0.3) when omitted.
    """

    text: str = Field(..., min_length=1, max_length=5000)
    threshold: Optional[float] = Field(default=None, gt=0.0, le=1.0)


class EvidenceExtractionResponse(BaseModel):
    """Response of POST /visits/{visit_id}/extract-evidences
    AND POST /extract-evidences-preview.

    visit_id is Optional on purpose: the preview endpoint has no visit, so it
    returns None there. The visit-scoped endpoint keeps the real UUID.
    """

    visit_id: Optional[UUID] = None
    text_chars: int
    detected: List[DetectedEvidence]
    stored_count: int
    duplicate_count: int
    model_version: Optional[str] = None
    inference_time_ms: Optional[float] = None
