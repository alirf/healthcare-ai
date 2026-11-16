"""Internal API key dependency for service-to-service calls."""
import hmac
import logging
from typing import Optional

from fastapi import Request

from app.config import settings
from app.exceptions import InternalAPIKeyError

logger = logging.getLogger(__name__)


async def verify_internal_api_key(
    request: Request,
    x_internal_api_key: Optional[str] = None
) -> bool:
    """Verify service-to-service API key for internal endpoints.

    Internal endpoints should NOT be exposed through the API Gateway.
    They are only accessible directly between microservices.

    When DEV_MODE=true the check is skipped entirely (local curl testing
    only — never enable in production).
    """
    if settings.DEV_MODE:
        return True

    # Get from header if not passed directly
    if x_internal_api_key is None:
        x_internal_api_key = request.headers.get("X-Internal-API-Key")

    provided = (x_internal_api_key or "").encode("utf-8")
    expected = settings.INTERNAL_API_KEY.encode("utf-8")
    if not provided or not hmac.compare_digest(provided, expected):
        logger.warning(
            "Rejected request to %s: missing or invalid internal API key",
            request.url.path,
        )
        raise InternalAPIKeyError()

    return True
