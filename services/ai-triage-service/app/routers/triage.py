"""Triage endpoints — the core of ai-triage-service.

Two endpoints, both INTERNAL (X-Internal-API-Key required):

1. POST /extract-evidences
   Lightweight: caller passes free text, gets back evidences + priority.
   This is what visit-intake-service calls on every chat message.

2. POST /visits/{visit_id}/triage
   Full orchestration: ai-triage-service fetches the visit context from
   visit-intake-service, runs extraction, optionally pushes AI symptoms
   back. Used when the visit is submitted (status → ai_processing).
"""
import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import verify_internal_api_key
from app.exceptions import NLPServiceUnavailableError, TriageError, VisitServiceUnavailableError
from app.schemas.nlp import ExtractResponse, ModelInfo
from app.schemas.triage import (
    TriagePriority,
    TriageRequest,
    TriageResponse,
    VisitTriageRequest,
    VisitTriageResponse,
)
from app.services.nlp_client import extract_evidences, get_model_info
from app.services.priority_engine import compute_priority
from app.services.visit_client import collect_patient_text, fetch_visit_context, push_ai_symptoms

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Triage"], dependencies=[Depends(verify_internal_api_key)])

MAX_SYMPTOM_NAME = 150
NOTES_MAX_CHARS = 4000


def _evidence_to_symptom_payload(evidence) -> dict:
    """Map one DetectedEvidence to the AI-symptom payload expected by
    visit-intake-service POST /internal/intake/visits/{id}/symptoms/ai.
    """
    display_name = (evidence.name_fa or evidence.name or evidence.evidence_id)
    display_name = display_name.strip()[:MAX_SYMPTOM_NAME]

    trace = {"evidence_id": evidence.evidence_id}
    if evidence.code_question:
        trace["code_question"] = evidence.code_question
    if evidence.question_fa:
        trace["question_fa"] = evidence.question_fa
    if evidence.question_en:
        trace["question_en"] = evidence.question_en
    if evidence.data_type:
        trace["data_type"] = evidence.data_type
    notes = json.dumps(trace, ensure_ascii=False, sort_keys=True)[:NOTES_MAX_CHARS]

    return {
        "symptom_name": display_name,
        "confidence": max(0.0, min(1.0, evidence.confidence)),
        "notes": notes,
    }


# =====================================================================
# 1. Lightweight extraction + priority
# =====================================================================

@router.post("/extract-evidences", response_model=TriageResponse)
async def extract_evidences_endpoint(data: TriageRequest) -> TriageResponse:
    """Free text → detected evidences + triage priority.

    This is the main endpoint caller services use. It:
      1. Calls ai-nlp-service POST /extract (ParsBERT inference)
      2. Computes a clinical priority from red-flag patterns
      3. Returns the enriched response

    If ai-nlp-service is unreachable or returns non-200, we raise 502 so the
    caller can surface an explicit error (no silent fallback to fake data).
    """
    nlp_result: ExtractResponse | None = await extract_evidences(
        text=data.text,
        threshold=data.threshold,
        top_k=data.top_k,
        apply_hierarchy_filter=data.apply_hierarchy_filter,
    )
    if nlp_result is None:
        raise NLPServiceUnavailableError(
            "ai-nlp-service is unreachable or returned an error"
        )

    priority, red_flags = compute_priority(nlp_result.detected)

    return TriageResponse(
        detected=nlp_result.detected,
        priority=priority,
        red_flag_evidence_ids=red_flags,
        text_chars=len(nlp_result.text),
        threshold=nlp_result.threshold,
        truncated=nlp_result.truncated,
        model_version=nlp_result.model_version,
        inference_time_ms=nlp_result.inference_time_ms,
    )


# =====================================================================
# 2. Full visit orchestration
# =====================================================================

@router.post("/visits/{visit_id}/triage", response_model=VisitTriageResponse)
async def triage_visit(
    visit_id: UUID,
    data: VisitTriageRequest,
) -> VisitTriageResponse:
    """Full triage for a visit: fetch context → extract → (push back).

    Flow:
      1. If patient_text was passed, use it directly; otherwise fetch the
         visit context from visit-intake-service and aggregate patient text.
      2. Run evidence extraction via ai-nlp-service.
      3. Compute priority + red flags.
      4. If push_results=true, store the detected evidences as AI symptoms
         on the visit (visit-intake-service deduplicates them).
    """
    # ── 1. resolve patient text ────────────────────────────────────────
    if data.patient_text:
        patient_text = data.patient_text
    else:
        visit_ctx = await fetch_visit_context(visit_id)
        if visit_ctx is None:
            raise VisitServiceUnavailableError(
                "Could not fetch visit context from visit-intake-service"
            )
        patient_text = collect_patient_text(visit_ctx)

    if not patient_text.strip():
        raise TriageError("Visit has no patient text to triage")

    # ── 2. run extraction ──────────────────────────────────────────────
    nlp_result = await extract_evidences(
        text=patient_text,
        threshold=data.threshold,
    )
    if nlp_result is None:
        raise NLPServiceUnavailableError(
            "ai-nlp-service is unreachable or returned an error"
        )

    # ── 3. compute priority ────────────────────────────────────────────
    priority, red_flags = compute_priority(nlp_result.detected)

    # ── 4. push AI symptoms back to visit-intake-service ───────────────
    pushed = False
    if data.push_results and nlp_result.detected:
        symptoms_payload = [_evidence_to_symptom_payload(e) for e in nlp_result.detected]
        stored = await push_ai_symptoms(
            visit_id, symptoms_payload, nlp_result.model_version
        )
        pushed = stored > 0
        logger.info(
            "Pushed %d AI symptom(s) to visit %s (%d stored, %d duplicate)",
            len(symptoms_payload),
            visit_id,
            stored,
            len(symptoms_payload) - stored,
        )

    return VisitTriageResponse(
        visit_id=visit_id,
        priority=priority,
        red_flag_evidence_ids=red_flags,
        detected=nlp_result.detected,
        text_chars=len(nlp_result.text),
        pushed_to_visit=pushed,
        model_version=nlp_result.model_version,
        inference_time_ms=nlp_result.inference_time_ms,
        triaged_at=datetime.now(timezone.utc),
    )


# =====================================================================
# 3. Model info (passthrough to ai-nlp-service)
# =====================================================================

@router.get("/model-info", response_model=ModelInfo)
async def model_info_endpoint() -> ModelInfo:
    """Passthrough to ai-nlp-service GET /model-info.

    Operators use this to check which ParsBERT checkpoint + evidence list
    is currently loaded, without having to talk to ai-nlp-service directly.
    """
    info = await get_model_info()
    if info is None:
        raise NLPServiceUnavailableError(
            "ai-nlp-service is unreachable or model-info failed"
        )
    return info
