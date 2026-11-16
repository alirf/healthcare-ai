"""Triage-specific schemas — orchestration layer on top of evidence extraction."""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.nlp import DetectedEvidence


class TriagePriority(str, Enum):
    """Clinical priority derived from the detected evidence pattern.

    The frontend chat uses this to colour-code the symptom boxes; the
    visit-intake-service uses it to set visit.priority.
    """

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    EMERGENCY = "emergency"


class TriageRequest(BaseModel):
    """Body of POST /extract-evidences (the main internal endpoint).

    Caller services (visit-intake-service, ...) send free text and receive
    back the detected evidences PLUS a triage priority and a red-flag list.
    """

    text: str = Field(..., min_length=1, max_length=5000)
    threshold: Optional[float] = Field(default=None, gt=0.0, le=1.0)
    top_k: Optional[int] = Field(default=None, ge=1)
    apply_hierarchy_filter: bool = True


class TriageResponse(BaseModel):
    """Response of POST /extract-evidences.

    Enriches the raw ai-nlp-service response with:
      - priority: low / normal / high / emergency (derived from red flags)
      - red_flag_evidence_ids: evidences that triggered the priority bump
      - text_chars: how many chars were actually sent to the model
    """

    detected: List[DetectedEvidence] = []
    priority: TriagePriority
    red_flag_evidence_ids: List[str] = []
    text_chars: int
    threshold: float
    truncated: bool
    model_version: str
    inference_time_ms: float


class VisitTriageRequest(BaseModel):
    """Body of POST /visits/{visit_id}/triage (full orchestration).

    The caller can let ai-triage-service fetch the visit context itself
    (default) or pass an explicit patient_text to skip the visit fetch.
    """

    patient_text: Optional[str] = Field(
        default=None,
        description="If provided, skip fetching the visit context and triage this text directly.",
        max_length=5000,
    )
    threshold: Optional[float] = Field(default=None, gt=0.0, le=1.0)
    push_results: bool = Field(
        default=True,
        description="If true, push detected symptoms back to visit-intake-service as AI symptoms.",
    )


class VisitTriageResponse(BaseModel):
    """Response of POST /visits/{visit_id}/triage."""

    visit_id: UUID
    priority: TriagePriority
    red_flag_evidence_ids: List[str] = []
    detected: List[DetectedEvidence] = []
    text_chars: int
    pushed_to_visit: bool
    model_version: str
    inference_time_ms: float
    triaged_at: datetime
