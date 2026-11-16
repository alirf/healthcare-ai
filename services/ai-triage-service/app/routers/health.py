"""Public health endpoint — no auth required."""
import logging

from fastapi import APIRouter, Response

from app.schemas.nlp import HealthResponse
from app.services.diagnosis_client import check_diagnosis_health
from app.services.nlp_client import check_nlp_health

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    response_model_exclude_none=True,
    responses={503: {"model": HealthResponse}},
)
async def health(response: Response) -> HealthResponse:
    """200 when the service is up AND both downstream AI services are reachable.

    The downstream checks are intentionally strict: if ParsBERT isn't loaded,
    triage can't work; if the diagnosis model isn't loaded, disease prediction
    can't work. We report 503 here if either is unhealthy, even though this
    service itself is up.

    Body includes both `nlp_service` and `diagnosis_service` fields.
    """
    nlp_ok = await check_nlp_health()
    diag_ok = await check_diagnosis_health()

    if nlp_ok and diag_ok:
        return HealthResponse(
            status="healthy",
            nlp_service="reachable",
            diagnosis_service="reachable",
        )

    errors = []
    if not nlp_ok:
        errors.append("ai-nlp-service is unreachable or its model is not loaded")
    if not diag_ok:
        errors.append("ai-diagnosis-service is unreachable or its model is not loaded")

    logger.warning("Health check failed: %s", "; ".join(errors))
    response.status_code = 503
    return HealthResponse(
        status="degraded",
        nlp_service="reachable" if nlp_ok else "unreachable",
        diagnosis_service="reachable" if diag_ok else "unreachable",
        error="; ".join(errors),
    )
