"""FastAPI application factory for Visit Intake Service.

Updated: registers the new diagnosis router (GET/POST /visits/{id}/diagnose,
GET /visits/{id}/ai-diagnosis, GET/POST /visits/{id}/final-diagnosis) and
imports the new SQLAlchemy models so the tables are registered with
Base.metadata.

See PATCH_NOTES.md for the full integration checklist.
"""
from contextlib import asynccontextmanager

# Import the models package so SQLAlchemy registers AIDiagnosisSuggestion
# and FinalDiagnosis with Base.metadata before create_all() runs.
import app.models  # noqa: F401

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
# ← preview + diagnosis added: exposes POST /extract-evidences-preview for the
# chat UI and the /visits/{id}/diagnose, /visits/{id}/ai-diagnosis,
# /visits/{id}/final-diagnosis endpoints for the doctor/patient UI.
from app.routers import patient, doctor, chat, internal, preview, diagnosis

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 {settings.APP_NAME} starting up...")
    print(f"   AI diagnosis enabled: {settings.AI_DIAGNOSIS_ENABLED}")
    print(f"   AI diagnosis trigger on claim: {settings.AI_DIAGNOSIS_TRIGGER_ON_CLAIM}")
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
        - AI disease suggestions for the doctor (NEW)
        - AI prescription drafts
        - Doctor-patient chat
        - Final doctor diagnosis with ICD-10 (NEW)
        - Visit completion → patient sees final diagnosis (NEW)

        Visits can be linked to medical records (medical_record_id);
        the medical-record service will be added later.

        Preview endpoint POST /extract-evidences-preview lets the frontend
        chat call ai-nlp-service on free text without creating a visit.

        Diagnosis endpoints:
          POST /visits/{id}/diagnose          — trigger AI diagnosis
          GET  /visits/{id}/ai-diagnosis      — fetch stored AI suggestions
          POST /visits/{id}/final-diagnosis   — doctor's final diagnosis (ICD-10)
          GET  /visits/{id}/final-diagnosis   — doctor/patient view
        """,
        version="1.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        redirect_slashes=False,
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
    app.include_router(preview.router)     # ← preview router for chat UI
    app.include_router(diagnosis.router)   # ← NEW diagnosis router

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
            "version": "1.1.0",
            "docs": "/docs" if settings.DEBUG else None,
        }

    return app


app = create_application()
