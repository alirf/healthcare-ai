"""Health endpoint — no auth required."""
import logging

from fastapi import APIRouter, Response

from app.schemas.diagnosis import ModelInfo
from app.services.model_service import diagnosis_model
from app.services.rule_engine import disease_registry

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health(response: Response) -> dict:
    """200 when the service is up. Model status is reported but doesn't affect HTTP code."""
    model_ok = diagnosis_model.loaded
    registry_ok = disease_registry.loaded

    status_str = "healthy" if (model_ok and registry_ok) else "degraded"

    return {
        "status": status_str,
        "model_loaded": model_ok,
        "disease_registry_loaded": registry_ok,
        "model_error": diagnosis_model.load_error if not model_ok else None,
        "registry_error": disease_registry.load_error if not registry_ok else None,
    }


@router.get("/model-info", response_model=ModelInfo)
async def model_info() -> ModelInfo:
    """Operator-facing model metadata."""
    return ModelInfo(
        model_type="LogisticRegression + DictVectorizer",
        model_path=settings.MODEL_PATH,
        diseases_path=settings.DISEASES_PATH,
        classes_count=diagnosis_model.classes_count,
        features_count=diagnosis_model.features_count,
        disease_registry_count=disease_registry.count,
        loaded_at=diagnosis_model.loaded_at,
    )


# need to import settings here
from app.config import settings  # noqa: E402
