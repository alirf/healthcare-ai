"""Inference endpoints: POST /extract and GET /model-info."""
import logging

from fastapi import APIRouter, Depends

from app.config import settings
from app.dependencies.auth import verify_internal_api_key
from app.exceptions import ModelNotLoadedError
from app.schemas.nlp import ExtractRequest, ExtractResponse, ModelInfo
from app.services import nlp_service as nlp_service_module
from app.services.nlp_service import NLPService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Evidence Extraction"])

MAX_TEXT_LENGTH = 5000


def _get_service() -> NLPService:
    # Resolve the singleton at request time so tests can monkeypatch
    # app.services.nlp_service.nlp_service with a fake.
    return nlp_service_module.nlp_service


def _ensure_loaded(service: NLPService) -> None:
    if not service.loaded:
        detail = "Model is not loaded"
        if service.load_error:
            detail = f"Model is not loaded: {service.load_error}"
        logger.error("Request rejected — %s", detail)
        raise ModelNotLoadedError(detail)


@router.post("/extract", response_model=ExtractResponse)
async def extract(
    payload: ExtractRequest,
    _api_key: bool = Depends(verify_internal_api_key),
) -> ExtractResponse:
    """Persian free text -> detected evidence codes with confidence scores."""
    service = _get_service()
    _ensure_loaded(service)

    text = payload.text or ""
    truncated = len(text) > MAX_TEXT_LENGTH
    if truncated:
        text = text[:MAX_TEXT_LENGTH]

    threshold = payload.threshold if payload.threshold is not None else settings.THRESHOLD

    if not text.strip():
        # Empty / whitespace-only input is a valid request with no evidence
        # (deliberately 200, not 400). No inference is run.
        logger.info("Empty or whitespace-only text received — returning empty result")
        return ExtractResponse(
            text=text,
            detected=[],
            threshold=threshold,
            apply_hierarchy_filter=payload.apply_hierarchy_filter,
            truncated=truncated,
            model_version=settings.MODEL_VERSION,
            inference_time_ms=0.0,
        )

    detected, elapsed_ms = await service.extract(
        text=text,
        threshold=threshold,
        top_k=payload.top_k,
        apply_hierarchy_filter=payload.apply_hierarchy_filter,
    )
    logger.info(
        "/extract: %d evidence(s) in %.1f ms (threshold=%s, top_k=%s, "
        "hierarchy_filter=%s, truncated=%s, chars=%d)",
        len(detected),
        elapsed_ms,
        threshold,
        payload.top_k,
        payload.apply_hierarchy_filter,
        truncated,
        len(text),
    )

    return ExtractResponse(
        text=text,
        detected=detected,
        threshold=threshold,
        apply_hierarchy_filter=payload.apply_hierarchy_filter,
        truncated=truncated,
        model_version=settings.MODEL_VERSION,
        inference_time_ms=round(elapsed_ms, 1),
    )


@router.get(
    "/model-info",
    response_model=ModelInfo,
    dependencies=[Depends(verify_internal_api_key)],
)
async def model_info() -> ModelInfo:
    """Checkpoint / evidence metadata for operators and callers."""
    service = _get_service()
    _ensure_loaded(service)

    return ModelInfo(
        model_name=settings.MODEL_NAME,
        checkpoint_path=settings.MODEL_PATH,
        evidence_path=settings.EVIDENCE_PATH,
        model_version=settings.MODEL_VERSION,
        evidence_count=service.evidence_count,
        threshold_default=settings.THRESHOLD,
        max_len=settings.MAX_LEN,
        device=service.device,
        training_f1=service.training_metadata.get("f1"),
        training_epoch=service.training_metadata.get("epoch"),
        loaded_at=service.loaded_at,
    )
