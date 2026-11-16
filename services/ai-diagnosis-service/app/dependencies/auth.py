"""Internal API key dependency — the ONLY auth on this service."""
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
