"""Application configuration using Pydantic Settings.

Backward-compatible: keeps BOTH the old AI_NLP_* names (so the original
evidence_extraction.py and nlp_client.py keep working) AND the new
AI_TRIAGE_* names (so the updated nlp_client.py that targets
ai-triage-service also works).

NEW: AI_DIAGNOSIS_* settings for the diagnosis flow (doctor claims visit →
visit-intake-service calls ai-triage-service POST /visits/{id}/diagnose,
stores the predictions, exposes them via GET /visits/{id}/ai-diagnosis).
"""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "Visit Intake Service"
    DEBUG: bool = False

    # Database (database-per-service: visits_db)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/visits_db"

    # JWT
    JWT_PUBLIC_KEY_PATH: str = "./keys/public.pem"
    JWT_ALGORITHM: str = "RS256"

    # Object Storage (MinIO/S3-compatible)
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "visit-files"
    MINIO_SECURE: bool = False

    # Internal API Security
    INTERNAL_API_KEY: str = ""

    # medical-record-service (sync hook)
    MEDICAL_RECORD_SERVICE_URL: str = "http://localhost:8000"

    # ── AI orchestration ──────────────────────────────────────────────
    # NEW names (preferred — used by the updated nlp_client.py)
    AI_TRIAGE_SERVICE_URL: str = "http://ai-triage-service:8000"
    AI_TRIAGE_ENABLED: bool = True
    AI_TRIAGE_TIMEOUT_SECONDS: float = 30.0

    # OLD names (kept for backward compat with the original evidence_extraction.py
    # and any other code that hasn't been updated yet).
    AI_NLP_SERVICE_URL: str = "http://ai-triage-service:8000"  # mirror triage URL for compat
    AI_NLP_ENABLED: bool = True
    AI_NLP_TIMEOUT_SECONDS: float = 30.0

    # Shared by both old and new code paths
    AI_NLP_TEXT_MAX_CHARS: int = 5000
    AI_NLP_THRESHOLD: Optional[float] = None   # None -> use the service default (0.3)

    # ── NEW — Diagnosis flow ──────────────────────────────────────────
    # When a doctor claims a visit, visit-intake-service calls
    # ai-triage-service POST /visits/{visit_id}/diagnose to get disease
    # predictions, stores them in visits_db.ai_diagnosis_suggestions, and
    # exposes them via GET /visits/{visit_id}/ai-diagnosis.
    AI_DIAGNOSIS_ENABLED: bool = True
    AI_DIAGNOSIS_TOP_K: int = 10
    AI_DIAGNOSIS_TIMEOUT_SECONDS: float = 45.0   # diagnosis takes longer than extract

    # If true, the doctor's claim-visit endpoint automatically triggers AI
    # diagnosis. If false, the doctor must hit POST /visits/{id}/diagnose
    # explicitly (useful for development / A/B testing).
    AI_DIAGNOSIS_TRIGGER_ON_CLAIM: bool = True

    # File Upload
    MAX_ATTACHMENT_SIZE_MB: int = 25
    ALLOWED_ATTACHMENT_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"   # ← tolerate unknown env vars instead of crashing


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
