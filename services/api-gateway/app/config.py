from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Gateway
    GATEWAY_PORT: int = 8080
    GATEWAY_HOST: str = "0.0.0.0"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Auth Service
    AUTH_SERVICE_URL: str = "http://localhost:3001"

    # Profile Service
    PROFILE_SERVICE_URL: str = "http://localhost:3002"
    
    # JWT
    PUBLIC_KEY_PATH: str = "keys/public.pem"
    
    # Rate Limiting
    RATE_LIMIT_PUBLIC: int = 10      # درخواست در دقیقه (IP-based)
    RATE_LIMIT_AUTH: int = 60        # درخواست در دقیقه (user-based)
    RATE_LIMIT_AI_TRIAGE: int = 5    # درخواست در دقیقه (user-based)
    RATE_LIMIT_PROFILE: int = 30     # درخواست در دقیقه (user-based)
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()