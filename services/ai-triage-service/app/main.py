"""FastAPI application factory for AI Triage Service.

This service is INTERNAL ONLY. It is not exposed through the API Gateway
and is never called directly by the frontend. Other backend services
(visit-intake-service, ...) call it with X-Internal-API-Key.

Architecture:
    frontend → visit-intake-service → ai-triage-service → ai-nlp-service
                                       (this service)      (ParsBERT)
                                                            ↘
                                                              ai-diagnosis-service
                                                              (LogisticRegression)
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import health, triage, diagnosis

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s starting up...", settings.APP_NAME)
    logger.info("  downstream: ai-nlp-service       = %s", settings.AI_NLP_SERVICE_URL)
    logger.info("  downstream: ai-diagnosis-service  = %s", settings.AI_DIAGNOSIS_SERVICE_URL)
    logger.info("  upstream:   visit-intake-service  = %s", settings.VISIT_INTAKE_SERVICE_URL)
    yield
    logger.info("%s shutting down...", settings.APP_NAME)


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="""
        Healthcare AI - AI Triage Service (INTERNAL)

        Orchestrator between caller services (visit-intake-service, ...) and
        AI model services:
          - ai-nlp-service       (ParsBERT — evidence extraction)
          - ai-diagnosis-service (LogisticRegression — disease prediction)

        NOT exposed through the API Gateway. Every endpoint except /health
        requires X-Internal-API-Key.

        Endpoints:
          POST /extract-evidences         — text → evidences + priority
          POST /visits/{id}/triage        — full visit triage orchestration
          POST /diagnose                  — evidences → disease predictions (passthrough)
          POST /visits/{id}/diagnose      — full visit diagnosis orchestration
          GET  /model-info                — passthrough to ai-nlp-service
          GET  /health                    — service + downstream health
        """,
        version="1.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        redirect_slashes=False,
    )

    # CORS: open within the docker network. The Gateway handles public CORS.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(triage.router)
    app.include_router(diagnosis.router)   # ← NEW diagnosis endpoints

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": "1.1.0",
            "type": "internal",
            "docs": "/docs",
        }

    return app


app = create_application()
