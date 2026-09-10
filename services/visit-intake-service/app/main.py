"""FastAPI application factory for Visit Intake Service."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import patient, doctor, chat, internal

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
        Healthcare AI - Visit Intake Service

        Manages the full lifecycle of an online consultation:
        - Intake messages (text + file attachments from patient)
        - Manual and AI-detected symptoms
        - AI disease suggestions for the doctor
        - AI prescription drafts
        - Doctor-patient chat
        - Final doctor prescription

        Visits can be linked to medical records (medical_record_id);
        the medical-record service will be added later.
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
    app.include_router(chat.router)
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
