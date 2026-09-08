# app/config.py
from pathlib import Path              # ← اضافه کن
from pydantic_settings import BaseSettings
from functools import lru_cache


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    GATEWAY_PORT: int = 8080
    GATEWAY_HOST: str = "0.0.0.0"
    REDIS_URL: str = "redis://localhost:6379"
    AUTH_SERVICE_URL: str = "http://localhost:3001"
    PROFILE_SERVICE_URL: str = "http://localhost:3002"
    PUBLIC_KEY_PATH: str = str(BASE_DIR / "keys" / "public.pem")
    RATE_LIMIT_PUBLIC: int = 10
    RATE_LIMIT_AUTH: int = 60
    RATE_LIMIT_AI_TRIAGE: int = 5
    RATE_LIMIT_PROFILE: int = 30
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    INTERNAL_API_KEY: str = "change-me-in-production-32-char-min"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()