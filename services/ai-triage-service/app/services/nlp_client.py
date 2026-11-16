"""Async client for ai-nlp-service (POST /extract, GET /model-info).

ai-triage-service is the ONLY service that talks to ai-nlp-service
directly. visit-intake-service and any future caller services go through
ai-triage-service so we can centralise:
  - auth (one outbound X-Internal-API-Key)
  - timeouts / retries
  - caching (TODO: Redis)
  - fallback to future LLM-based extraction
"""
import logging
from typing import Optional

import httpx

from app.config import settings
from app.schemas.nlp import ExtractResponse, ModelInfo

logger = logging.getLogger(__name__)


def _internal_headers() -> dict:
    """Headers attached to every outgoing internal call."""
    h = {}
    if settings.INTERNAL_API_KEY:
        h["X-Internal-API-Key"] = settings.INTERNAL_API_KEY
    return h


async def extract_evidences(
    text: str,
    threshold: Optional[float] = None,
    top_k: Optional[int] = None,
    apply_hierarchy_filter: bool = True,
) -> Optional[ExtractResponse]:
    """Call ai-nlp-service POST /extract and return the parsed response.

    Returns None on any failure (network error, non-200, malformed JSON).
    The caller decides whether None is fatal (raises 502) or recoverable.
    """
    if not settings.AI_NLP_SERVICE_URL:
        logger.error("AI_NLP_SERVICE_URL is not configured")
        return None

    payload = {
        "text": text,
        "apply_hierarchy_filter": apply_hierarchy_filter,
    }
    if threshold is not None:
        payload["threshold"] = threshold
    if top_k is not None:
        payload["top_k"] = top_k

    url = f"{settings.AI_NLP_SERVICE_URL.rstrip('/')}/extract"
    try:
        async with httpx.AsyncClient(timeout=settings.AI_NLP_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("ai-nlp-service call failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        logger.warning(
            "ai-nlp-service returned HTTP %s: %s",
            resp.status_code,
            resp.text[:500],
        )
        return None

    try:
        return ExtractResponse.model_validate(resp.json())
    except ValueError as exc:
        logger.warning("ai-nlp-service returned an unexpected payload: %s", exc)
        return None


async def get_model_info() -> Optional[ModelInfo]:
    """Call ai-nlp-service GET /model-info (operator-facing metadata)."""
    if not settings.AI_NLP_SERVICE_URL:
        return None

    url = f"{settings.AI_NLP_SERVICE_URL.rstrip('/')}/model-info"
    try:
        async with httpx.AsyncClient(timeout=settings.AI_NLP_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("ai-nlp-service model-info call failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        return None

    try:
        return ModelInfo.model_validate(resp.json())
    except ValueError:
        return None


async def check_nlp_health() -> bool:
    """Lightweight reachability check (GET /health, no auth needed)."""
    if not settings.AI_NLP_SERVICE_URL:
        return False

    url = f"{settings.AI_NLP_SERVICE_URL.rstrip('/')}/health"
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

    # ai-nlp-service reports model_loaded in /health — treat unloaded as down
    return bool(body.get("model_loaded", False))
