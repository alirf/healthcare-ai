"""Application configuration using Pydantic Settings.

Updated: now points at TWO downstream AI services:
  - ai-nlp-service       (ParsBERT — evidence extraction)
  - ai-diagnosis-service (LogisticRegression — disease prediction)

ai-triage-service is INTERNAL ONLY:
  - called by other services (visit-intake-service, ...) with
    X-Internal-API-Key, never directly by the frontend;
  - it calls downstream AI model services with the same internal key.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from environment variables."""

    # App
    APP_NAME: str = "AI Triage Service"
    DEBUG: bool = False
    PORT: int = 8000

    # Downstream AI model services (this service is the caller)
    AI_NLP_SERVICE_URL: str = "http://ai-nlp-service:8000"
    AI_NLP_TIMEOUT_SECONDS: float = 30.0

    # NEW — ai-diagnosis-service (disease prediction from evidence_ids)
    AI_DIAGNOSIS_SERVICE_URL: str = "http://ai-diagnosis-service:8000"
    AI_DIAGNOSIS_TIMEOUT_SECONDS: float = 30.0
    AI_DIAGNOSIS_DEFAULT_TOP_K: int = 10

    # Upstream caller services (for the full-orchestration endpoints)
    VISIT_INTAKE_SERVICE_URL: str = "http://visit-intake-service:8000"
    VISIT_INTAKE_TIMEOUT_SECONDS: float = 15.0

    # Internal API key — shared across all internal services.
    # Used both to verify incoming calls and to authenticate outgoing calls.
    INTERNAL_API_KEY: str = "internal-secret-key-12345"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
