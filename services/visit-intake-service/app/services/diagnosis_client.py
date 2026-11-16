"""Async client for ai-triage-service diagnosis endpoints.

Two public functions:
  - trigger_visit_diagnosis(visit_id, ...) → calls POST /visits/{id}/diagnose
  - diagnose(evidence_ids, patient_sex, ...) → calls POST /diagnose (lightweight)

Both return Pydantic models (or None on failure) so callers can decide
whether to fail loud or soft.

ai-triage-service handles all the heavy lifting (fetching visit context,
resolving evidences, calling ai-diagnosis-service). visit-intake-service
just passes the visit_id and gets back the predictions.
"""
import logging
from typing import List, Optional
from uuid import UUID

import httpx
from pydantic import BaseModel

from app.config import get_settings
from app.schemas.diagnosis import (
    AIDiagnosisResponse,
    DiseasePrediction,
    MatchedEvidence,
)

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────
# Mirror of ai-triage-service VisitDiagnosisResponse (tolerant client view)
# ──────────────────────────────────────────────────────────────────────

class _VisitDiagnosisResponse(BaseModel):
    """Mirror of ai-triage-service VisitDiagnosisResponse.

    We define a private local mirror so a small schema drift on
    ai-triage-service doesn't break this client — extra="ignore".
    """

    model_config = {"extra": "ignore"}

    visit_id: str
    predictions: List[DiseasePrediction] = []
    input_evidence_count: int = 0
    patient_sex: str = "M"
    evidence_source: str = "stored_ai_symptoms"
    model_version: str = "unknown"
    inference_time_ms: float = 0.0
    rule_engine_version: str = "unknown"
    diagnosed_at: str = ""


def _internal_headers() -> dict:
    h = {}
    settings = get_settings()
    if settings.INTERNAL_API_KEY:
        h["X-Internal-API-Key"] = settings.INTERNAL_API_KEY
    return h


async def trigger_visit_diagnosis(
    visit_id: UUID,
    patient_sex: Optional[str] = None,
    patient_age: Optional[int] = None,
    top_k: Optional[int] = None,
    reextract: bool = False,
) -> Optional[_VisitDiagnosisResponse]:
    """Call ai-triage-service POST /visits/{visit_id}/diagnose.

    Returns None on any failure (network, non-200, malformed payload).
    The caller decides whether None is fatal (raises 502) or recoverable.
    """
    settings = get_settings()
    if not settings.AI_TRIAGE_ENABLED:
        logger.info("AI_TRIAGE_ENABLED is false — skipping diagnosis")
        return None
    if not settings.AI_TRIAGE_SERVICE_URL:
        logger.warning("AI_TRIAGE_SERVICE_URL is not set — skipping diagnosis")
        return None

    payload: dict = {"reextract": reextract}
    if patient_sex is not None:
        payload["patient_sex"] = patient_sex
    if patient_age is not None:
        payload["patient_age"] = patient_age
    if top_k is not None:
        payload["top_k"] = top_k
    else:
        payload["top_k"] = settings.AI_DIAGNOSIS_TOP_K

    url = (
        f"{settings.AI_TRIAGE_SERVICE_URL.rstrip('/')}"
        f"/visits/{visit_id}/diagnose"
    )
    try:
        async with httpx.AsyncClient(timeout=settings.AI_DIAGNOSIS_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("ai-triage-service diagnose call failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        logger.warning(
            "ai-triage-service diagnose returned HTTP %s: %s",
            resp.status_code,
            resp.text[:500],
        )
        return None

    try:
        return _VisitDiagnosisResponse.model_validate(resp.json())
    except ValueError as exc:
        logger.warning("ai-triage-service diagnose returned an unexpected payload: %s", exc)
        return None


async def diagnose(
    evidence_ids: List[str],
    patient_sex: Optional[str] = None,
    patient_age: Optional[int] = None,
    top_k: Optional[int] = None,
) -> Optional[_VisitDiagnosisResponse]:
    """Call ai-triage-service POST /diagnose (lightweight passthrough).

    Use this only when you already have evidence_ids in hand and don't want
    the visit-context orchestration. The visit-scoped endpoint
    (trigger_visit_diagnosis) is preferred for the doctor-claim flow.
    """
    settings = get_settings()
    if not settings.AI_TRIAGE_ENABLED or not settings.AI_TRIAGE_SERVICE_URL:
        return None

    payload: dict = {"evidence_ids": evidence_ids}
    if patient_sex is not None:
        payload["patient_sex"] = patient_sex
    if patient_age is not None:
        payload["patient_age"] = patient_age
    if top_k is not None:
        payload["top_k"] = top_k
    else:
        payload["top_k"] = settings.AI_DIAGNOSIS_TOP_K

    url = f"{settings.AI_TRIAGE_SERVICE_URL.rstrip('/')}/diagnose"
    try:
        async with httpx.AsyncClient(timeout=settings.AI_DIAGNOSIS_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("ai-triage-service /diagnose call failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        logger.warning(
            "ai-triage-service /diagnose returned HTTP %s: %s",
            resp.status_code,
            resp.text[:500],
        )
        return None

    try:
        # POST /diagnose returns DiagnosisResponse (no visit_id / evidence_source).
        # Wrap it in our local mirror shape so callers have a uniform interface.
        body = resp.json()
        return _VisitDiagnosisResponse(
            visit_id="",
            predictions=body.get("predictions", []),
            input_evidence_count=body.get("input_evidence_count", 0),
            patient_sex=body.get("patient_sex", "M"),
            evidence_source="passthrough",
            model_version=body.get("model_version", "unknown"),
            inference_time_ms=body.get("inference_time_ms", 0.0),
            rule_engine_version=body.get("rule_engine_version", "unknown"),
            diagnosed_at="",
        )
    except ValueError as exc:
        logger.warning("ai-triage-service /diagnose returned an unexpected payload: %s", exc)
        return None
