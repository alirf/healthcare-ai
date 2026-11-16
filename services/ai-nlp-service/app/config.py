"""Application configuration using Pydantic Settings."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

# Relative artefact paths are resolved against the service directory, never
# against the process cwd (uvicorn may be started from anywhere).
SERVICE_ROOT = Path(__file__).resolve().parents[1]


def _resolve_path(value: str) -> str:
    path = Path(value)
    return str(path if path.is_absolute() else (SERVICE_ROOT / path).resolve())


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "AI NLP Service"
    DEBUG: bool = False
    PORT: int = 8000

    # Model artefacts
    MODEL_PATH: str = "./models/best_model.pt"
    EVIDENCE_PATH: str = "./models/evidence_list_clean.json"
    MODEL_NAME: str = "HooshvareLab/bert-fa-base-uncased"
    MODEL_VERSION: str = "parsbert-v1"

    # Inference
    THRESHOLD: float = 0.3
    MAX_LEN: int = 128
    DEVICE: str = ""  # empty = auto-detect (cuda if available, else cpu)

    # Internal API Security (service-to-service calls only; no JWT here)
    INTERNAL_API_KEY: str = "internal-secret-key-12345"
    # DEV_MODE=true skips the internal API key check — local testing only!
    DEV_MODE: bool = False

    def model_post_init(self, __context) -> None:
        self.MODEL_PATH = _resolve_path(self.MODEL_PATH)
        self.EVIDENCE_PATH = _resolve_path(self.EVIDENCE_PATH)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
