"""Application configuration using Pydantic Settings."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "Medical Record Service"
    DEBUG: bool = False

    # Database (database-per-service: medical_records_db)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5435/medical_records_db"

    # JWT (fallback validation when request does not come through the gateway)
    JWT_PUBLIC_KEY_PATH: str = "./keys/public.pem"
    JWT_ALGORITHM: str = "RS256"

    # Object Storage (MinIO/S3-compatible) — record attachments
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "medical-records"
    MINIO_SECURE: bool = False
    MINIO_PRESIGN_EXPIRES: int = 3600 * 24 * 7

    # Internal API Security (service-to-service calls)
    INTERNAL_API_KEY: str = ""

    # File Upload
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_FILE_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
    ]

    # visit-intake-service (doctor endpoint looks up treated patients there)
    VISIT_INTAKE_SERVICE_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
