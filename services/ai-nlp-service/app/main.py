"""FastAPI application factory for AI NLP Service."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.routers.extract import router as extract_router
from app.routers.health import router as health_router
from app.services import nlp_service as nlp_service_module

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s starting up (dev_mode=%s)...", settings.APP_NAME, settings.DEV_MODE)
    # Loading torch weights is blocking work — keep it off the event loop.
    await run_in_threadpool(nlp_service_module.nlp_service.load)
    if nlp_service_module.nlp_service.loaded:
        logger.info("Model loaded on %s — service ready", nlp_service_module.nlp_service.device)
    else:
        logger.error(
            "Service started in degraded mode: model failed to load (%s) — /health returns 503",
            nlp_service_module.nlp_service.load_error,
        )
    yield
    logger.info("%s shutting down...", settings.APP_NAME)
    nlp_service_module.nlp_service.unload()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="""
        Healthcare AI - AI NLP Service

        Stateless inference microservice:
        - Persian free text in
        - Detected evidence codes with confidence scores out

        Internal-only. No database, no JWT, no orchestration — the
        visit-intake-service calls /extract, then triage, then persists
        the results in its own database.
        """,
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        redirect_slashes=False,
    )

    app.include_router(health_router)
    app.include_router(extract_router)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": "1.0.0",
            "model_loaded": nlp_service_module.nlp_service.loaded,
        }

    return app


app = create_application()
