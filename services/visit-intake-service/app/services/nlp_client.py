"""Async client for ai-triage-service (POST /extract-evidences).

CHANGED: this client now calls ai-triage-service instead of ai-nlp-service
directly. ai-triage-service is the internal orchestrator that:
  - forwards the request to ai-nlp-service (ParsBERT)
  - computes a clinical priority from red-flag patterns
  - returns the enriched result

The public surface of this module is unchanged (extract_evidences still
returns the same ExtractResult), so evidence_extraction.py and the rest of
visit-intake-service keep working without any other change.

If ai-triage-service is unavailable we return None and the caller decides
whether to fail loud (POST /extract-evidences) or soft (submit hook).
"""
import logging
from typing import Optional

import httpx

from app.config import get_settings
from app.schemas.nlp import ExtractResult, DetectedEvidence

logger = logging.getLogger(__name__)


async def extract_evidences(text: str) -> Optional[ExtractResult]:
    """Send Persian free text to ai-triage-service and return the parsed result.

    Returns None when:
      - AI_TRIAGE_ENABLED is false,
      - AI_TRIAGE_SERVICE_URL is empty,
      - the call fails (network error / timeout / non-200 / malformed payload).
    """
    settings = get_settings()

    if not settings.AI_TRIAGE_ENABLED:
        logger.info("AI_TRIAGE_ENABLED is false — skipping evidence extraction")
        return None

    if not settings.AI_TRIAGE_SERVICE_URL:
        logger.warning("AI_TRIAGE_SERVICE_URL is not set — skipping evidence extraction")
        return None

    payload = {"text": text}
    if settings.AI_NLP_THRESHOLD is not None:
        payload["threshold"] = settings.AI_NLP_THRESHOLD

    headers = {}
    if settings.INTERNAL_API_KEY:
        headers["X-Internal-API-Key"] = settings.INTERNAL_API_KEY

    # ai-triage-service exposes POST /extract-evidences (internal, X-Internal-API-Key)
    url = f"{settings.AI_TRIAGE_SERVICE_URL.rstrip('/')}/extract-evidences"
    try:
        async with httpx.AsyncClient(timeout=settings.AI_TRIAGE_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.warning("ai-triage-service call failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        logger.warning(
            "ai-triage-service returned HTTP %s: %s",
            resp.status_code,
            resp.text[:500],
        )
        return None

    try:
        body = resp.json()
    except ValueError:
        logger.warning("ai-triage-service returned a non-JSON body")
        return None

    # ai-triage-service returns TriageResponse = ExtractResponse + priority +
    # red_flag_evidence_ids. We only need the ExtractResult fields here;
    # priority is logged for observability but visit-intake-service doesn't
    # use it (the frontend chat reads it via the preview endpoint).
    try:
        detected = [
            DetectedEvidence.model_validate(d) for d in body.get("detected", [])
        ]
    except ValueError as exc:
        logger.warning("ai-triage-service returned an unexpected evidence shape: %s", exc)
        return None

    result = ExtractResult(
        detected=detected,
        threshold=body.get("threshold"),
        truncated=body.get("truncated"),
        model_version=body.get("model_version"),
        inference_time_ms=body.get("inference_time_ms"),
    )

    logger.info(
        "ai-triage-service: %d evidence(s) in %s ms (priority=%s, model_version=%s)",
        len(result.detected),
        result.inference_time_ms,
        body.get("priority"),
        result.model_version,
    )
    return result
