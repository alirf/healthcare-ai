"""Internal API key dependency — the ONLY auth on this service.

ai-triage-service is internal-only. It is NEVER exposed through the API
Gateway and NEVER called directly by the frontend. Every incoming request
must carry X-Internal-API-Key matching the shared INTERNAL_API_KEY.

Outgoing calls (to ai-nlp-service, visit-intake-service, ...) attach the
same key in their X-Internal-API-Key header.
"""
import hmac
import logging
from typing import Optional

from fastapi import Request

from app.config import settings
from app.exceptions import InternalAPIKeyError

logger = logging.getLogger(__name__)


async def verify_internal_api_key(
    request: Request,
    x_internal_api_key: Optional[str] = None,
) -> bool:
    """Verify the service-to-service API key.

    The check is constant-time (hmac.compare_digest) to avoid timing attacks.
    """
    if x_internal_api_key is None:
        x_internal_api_key = request.headers.get("X-Internal-API-Key")

    provided = (x_internal_api_key or "").encode("utf-8")
    expected = settings.INTERNAL_API_KEY.encode("utf-8")

    if not provided or not hmac.compare_digest(provided, expected):
        logger.warning(
            "Rejected request to %s %s: missing or invalid internal API key",
            request.method,
            request.url.path,
        )
        raise InternalAPIKeyError()

    return True
