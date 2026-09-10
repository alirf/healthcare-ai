"""Application configuration using Pydantic Settings."""
from functools import lru_cache

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

    # Object Storage (MinIO/S3-compatible) — files exchanged inside visit messages
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "visit-files"
    MINIO_SECURE: bool = False

    # Internal API Security (AI services call these endpoints)
    INTERNAL_API_KEY: str = ""

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


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
