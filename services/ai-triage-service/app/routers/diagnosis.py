"""Diagnosis endpoints — orchestration on top of ai-diagnosis-service.

Two endpoints, both INTERNAL (X-Internal-API-Key required):

1. POST /diagnose
   Lightweight passthrough: caller passes {evidence_ids, patient_sex, ...}
   and gets back the disease predictions. This is a thin proxy to
   ai-diagnosis-service POST /diagnose — keeps the caller's auth surface
   to one service (ai-triage-service).

2. POST /visits/{visit_id}/diagnose
   Full orchestration: ai-triage-service:
     a) fetches visit context from visit-intake-service
     b) resolves evidence_ids from stored AI symptoms (or re-extracts them
        from patient text via ai-nlp-service if `reextract=true`)
     c) resolves patient_sex / patient_age from visit context
     d) calls ai-diagnosis-service POST /diagnose
     e) returns the predictions + metadata
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies.auth import verify_internal_api_key
from app.exceptions import (
    DiagnosisError,
    DiagnosisServiceUnavailableError,
    NLPServiceUnavailableError,
    VisitServiceUnavailableError,
)
from app.schemas.diagnosis import (
    DiagnosisRequest,
    DiagnosisResponse,
    VisitDiagnosisRequest,
    VisitDiagnosisResponse,
)
from app.services.diagnosis_client import diagnose as call_diagnosis
from app.services.nlp_client import extract_evidences as call_nlp_extract
from app.services.visit_client import (
    collect_patient_text,
    collect_stored_evidence_ids,
    fetch_visit_context,
    resolve_patient_age,
    resolve_patient_sex,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Diagnosis"], dependencies=[Depends(verify_internal_api_key)])


# =====================================================================
# 1. Lightweight passthrough
# =====================================================================

@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose_endpoint(data: DiagnosisRequest) -> DiagnosisResponse:
    """Direct passthrough to ai-diagnosis-service POST /diagnose.

    Caller supplies evidence_ids + patient_sex (+ optional age / top_k).
    No visit context is fetched — this is the bare ML inference.

    Auth: requires X-Internal-API-Key header.
    """
    result = await call_diagnosis(data)
    if result is None:
        raise DiagnosisServiceUnavailableError(
            "ai-diagnosis-service is unreachable or returned an error"
        )
    return result


# =====================================================================
# 2. Full visit orchestration
# =====================================================================

@router.post("/visits/{visit_id}/diagnose", response_model=VisitDiagnosisResponse)
async def diagnose_visit(
    visit_id: UUID,
    data: VisitDiagnosisRequest,
) -> VisitDiagnosisResponse:
    """Diagnose a visit end-to-end.

    Flow:
      1. Fetch visit context from visit-intake-service.
      2. Resolve evidence_ids:
         - default: from stored AI symptoms (notes.evidence_id)
         - if `reextract=true`: re-run ParsBERT on patient text
      3. Resolve patient_sex / patient_age from visit context.
      4. Call ai-diagnosis-service POST /diagnose.
      5. Return predictions + metadata.

    Auth: requires X-Internal-API-Key header.
    """
    # ── 1. fetch visit context ────────────────────────────────────────
    visit_ctx = await fetch_visit_context(visit_id)
    if visit_ctx is None:
        raise VisitServiceUnavailableError(
            "Could not fetch visit context from visit-intake-service"
        )

    # ── 2. resolve evidence_ids ───────────────────────────────────────
    evidence_source = "stored_ai_symptoms"
    evidence_ids = collect_stored_evidence_ids(visit_ctx)

    if data.reextract or not evidence_ids:
        patient_text = collect_patient_text(visit_ctx)
        if not patient_text.strip():
            raise DiagnosisError(
                "Visit has no patient text and no stored AI symptoms — cannot diagnose"
            )
        nlp_result = await call_nlp_extract(text=patient_text)
        if nlp_result is None:
            raise NLPServiceUnavailableError(
                "ai-nlp-service is unreachable — cannot re-extract evidences"
            )
        evidence_ids = [e.evidence_id for e in nlp_result.detected]
        evidence_source = "reextracted"
        logger.info(
            "Re-extracted %d evidences from patient text for visit %s",
            len(evidence_ids),
            visit_id,
        )

    if not evidence_ids:
        raise DiagnosisError(
            "No evidence_ids available for diagnosis — visit has no AI symptoms "
            "and patient text yielded no evidences"
        )

    # ── 3. resolve patient sex / age ──────────────────────────────────
    patient_sex = (data.patient_sex or resolve_patient_sex(visit_ctx)).upper()
    patient_age = data.patient_age if data.patient_age is not None else resolve_patient_age(visit_ctx)

    # ── 4. call ai-diagnosis-service ──────────────────────────────────
    from app.schemas.diagnosis import DiagnosisRequest as _DR
    diag_request = _DR(
        evidence_ids=evidence_ids,
        patient_sex=patient_sex,
        patient_age=patient_age,
        top_k=data.top_k,
    )
    diag_result = await call_diagnosis(diag_request)
    if diag_result is None:
        raise DiagnosisServiceUnavailableError(
            "ai-diagnosis-service is unreachable or returned an error"
        )

    logger.info(
        "Diagnosis for visit %s: %d predictions (source=%s, sex=%s, evidences=%d)",
        visit_id,
        len(diag_result.predictions),
        evidence_source,
        patient_sex,
        len(evidence_ids),
    )

    # ── 5. return ─────────────────────────────────────────────────────
    return VisitDiagnosisResponse(
        visit_id=str(visit_id),
        predictions=diag_result.predictions,
        input_evidence_count=diag_result.input_evidence_count,
        patient_sex=diag_result.patient_sex,
        evidence_source=evidence_source,
        model_version=diag_result.model_version,
        inference_time_ms=diag_result.inference_time_ms,
        rule_engine_version=diag_result.rule_engine_version,
        diagnosed_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
