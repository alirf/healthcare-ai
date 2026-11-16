"""Async client for ai-diagnosis-service (POST /diagnose).

ai-triage-service is the ONLY service that talks to ai-diagnosis-service
directly. visit-intake-service and any future caller services go through
ai-triage-service so we can centralise:
  - auth (one outbound X-Internal-API-Key)
  - timeouts / retries
  - evidence source resolution (stored symptoms vs re-extracted text)
  - future caching of (evidence_set, sex) → predictions
"""
import logging
from typing import Optional

import httpx

from app.config import settings
from app.schemas.diagnosis import DiagnosisRequest, DiagnosisResponse

logger = logging.getLogger(__name__)


def _internal_headers() -> dict:
    """Headers attached to every outgoing internal call."""
    h = {}
    if settings.INTERNAL_API_KEY:
        h["X-Internal-API-Key"] = settings.INTERNAL_API_KEY
    return h


async def diagnose(data: DiagnosisRequest) -> Optional[DiagnosisResponse]:
    """Call ai-diagnosis-service POST /diagnose and return the parsed response.

    Returns None on any failure (network error, non-200, malformed JSON).
    The caller decides whether None is fatal (raises 502) or recoverable.
    """
    if not settings.AI_DIAGNOSIS_SERVICE_URL:
        logger.error("AI_DIAGNOSIS_SERVICE_URL is not configured")
        return None

    payload = data.model_dump(exclude_none=True)
    # ensure top_k is always sent (default applied by Pydantic)
    payload.setdefault("top_k", settings.AI_DIAGNOSIS_DEFAULT_TOP_K)

    url = f"{settings.AI_DIAGNOSIS_SERVICE_URL.rstrip('/')}/diagnose"
    try:
        async with httpx.AsyncClient(timeout=settings.AI_DIAGNOSIS_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("ai-diagnosis-service call failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        logger.warning(
            "ai-diagnosis-service returned HTTP %s: %s",
            resp.status_code,
            resp.text[:500],
        )
        return None

    try:
        return DiagnosisResponse.model_validate(resp.json())
    except ValueError as exc:
        logger.warning("ai-diagnosis-service returned an unexpected payload: %s", exc)
        return None


async def check_diagnosis_health() -> bool:
    """Lightweight reachability check (GET /health)."""
    if not settings.AI_DIAGNOSIS_SERVICE_URL:
        return False

    url = f"{settings.AI_DIAGNOSIS_SERVICE_URL.rstrip('/')}/health"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
    except httpx.HTTPError:
        return False

    if resp.status_code != 200:
        return False

    try:
        body = resp.json()
    except ValueError:
        return False

    # ai-diagnosis-service reports model_loaded in /health
    return bool(body.get("model_loaded", False))
