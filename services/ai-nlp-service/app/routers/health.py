"""Public health endpoint."""
import logging

from fastapi import APIRouter, Response

from app.schemas.nlp import HealthResponse
from app.services import nlp_service as nlp_service_module

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    response_model_exclude_none=True,
    responses={503: {"model": HealthResponse}},
)
async def health(response: Response) -> HealthResponse:
    """200 when the model is loaded, 503 otherwise. No auth required."""
    service = nlp_service_module.nlp_service
    if service.loaded:
        return HealthResponse(
            status="healthy",
            model_loaded=True,
            device=service.device,
            evidence_count=service.evidence_count,
        )

    logger.warning("Health check failed: model not loaded (%s)", service.load_error)
    response.status_code = 503
    return HealthResponse(
        status="unhealthy",
        model_loaded=False,
        error=service.load_error or "Model is not loaded",
    )
