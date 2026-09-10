"""FastAPI application factory for Medical Record Service."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import patient, doctor, internal

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 {settings.APP_NAME} starting up...")
    yield
    print(f"🛑 {settings.APP_NAME} shutting down...")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="""
        Healthcare AI - Medical Record Service

        Manages long-running medical records for patients:
        - A record (e.g. type heart_attack) is opened once and can collect
          visits from many different doctors over time.
        - Visits live in visit-intake-service; here we keep only a UUID
          junction (record_visits) — no cross-database foreign keys.
        - Record attachments (lab results, images) are stored in MinIO
          (bucket: medical-records) with presigned URLs.

        ## Authentication
        Patient/doctor endpoints accept trusted gateway headers
        (x-gateway-request / x-user-id / x-user-role) or a JWT Bearer token.
        Internal endpoints require an `X-Internal-API-Key` header and must
        never be exposed through the API Gateway.
        """,
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.DEBUG else [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(patient.router)
    app.include_router(doctor.router)
    app.include_router(internal.router)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "service": settings.APP_NAME}

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": "1.0.0",
            "docs": "/docs" if settings.DEBUG else None,
        }

    return app


app = create_application()
