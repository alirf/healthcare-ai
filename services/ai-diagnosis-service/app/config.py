"""Application configuration."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

SERVICE_ROOT = Path(__file__).resolve().parents[1]


def _resolve_path(value: str) -> str:
    path = Path(value)
    return str(path if path.is_absolute() else (SERVICE_ROOT / path).resolve())


class Settings(BaseSettings):
    APP_NAME: str = "AI Diagnosis Service"
    DEBUG: bool = False
    PORT: int = 8000

    # Model artefacts
    MODEL_PATH: str = "./models/diagnosis_model.pkl"
    DISEASES_PATH: str = "./models/diseases_fixed.json"
    SYMPTOMS_PATH: str = "./models/symptoms_fixed.json"

    # Diagnosis parameters
    DEFAULT_TOP_K: int = 10
    MIN_PROBABILITY: float = 0.01     # filter out diseases below this
    ML_WEIGHT: float = 0.7            # weight of ML score in final combined score
    RULE_WEIGHT: float = 0.3          # weight of rule-based score

    # Internal API Security
    INTERNAL_API_KEY: str = "internal-secret-key-12345"

    def model_post_init(self, __context) -> None:
        self.MODEL_PATH = _resolve_path(self.MODEL_PATH)
        self.DISEASES_PATH = _resolve_path(self.DISEASES_PATH)
        self.SYMPTOMS_PATH = _resolve_path(self.SYMPTOMS_PATH)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
