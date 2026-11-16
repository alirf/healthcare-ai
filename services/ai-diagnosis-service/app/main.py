"""FastAPI application factory for AI Diagnosis Service."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.routers import diagnosis, health
from app.services.model_service import diagnosis_model
from app.services.rule_engine import disease_registry

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s starting up...", settings.APP_NAME)
    logger.info("  model path:      %s", settings.MODEL_PATH)
    logger.info("  diseases path:   %s", settings.DISEASES_PATH)
    # Loading the model and registry is blocking — keep it off the event loop
    await run_in_threadpool(diagnosis_model.load)
    await run_in_threadpool(disease_registry.load)
    if diagnosis_model.loaded and disease_registry.loaded:
        logger.info(
            "Model ready — %d disease classes, %d diseases in registry",
            diagnosis_model.classes_count,
            disease_registry.count,
        )
    else:
        logger.error(
            "Service started in degraded mode: model=%s registry=%s",
            diagnosis_model.loaded,
            disease_registry.loaded,
        )
    yield
    logger.info("%s shutting down...", settings.APP_NAME)
    diagnosis_model.unload()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="""
        Healthcare AI - AI Diagnosis Service (INTERNAL)

        Predicts probable diseases from a list of evidence IDs (symptoms).

        Uses a hybrid scoring system:
          - ML model: LogisticRegression trained on 457 diseases × 1243 features
          - Rule engine: weight matching against diseases_fixed.json

        NOT exposed through the API Gateway. Every endpoint except /health
        requires X-Internal-API-Key.

        Endpoints:
          POST /diagnose     — evidence_ids → disease predictions
          GET  /health       — service + model health
          GET  /model-info   — model metadata
        """,
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        redirect_slashes=False,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(diagnosis.router)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": "1.0.0",
            "type": "internal",
            "docs": "/docs",
        }

    return app


app = create_application()
