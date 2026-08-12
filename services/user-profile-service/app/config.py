"""Application configuration using Pydantic Settings."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "User Profile Service"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/profile_db"

    # JWT
    JWT_PUBLIC_KEY_PATH: str = "./keys/public.pem"
    JWT_ALGORITHM: str = "RS256"

    # Object Storage (MinIO/S3-compatible)
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_NAME: str = "profile-images"
    MINIO_SECURE: bool = False

    # Internal API Security
    INTERNAL_API_KEY: str = ""

    # File Upload
    MAX_AVATAR_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()