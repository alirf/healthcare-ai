# app/config.py
import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://admin:admin@localhost:5432/healthcare_auth"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    
    # JWT
    JWT_PRIVATE_KEY_PATH: str = str(BASE_DIR / "keys" / "private.pem")
    JWT_PUBLIC_KEY_PATH: str = str(BASE_DIR / "keys" / "public.pem")
    JWT_ACCESS_EXPIRATION: int = 900
    JWT_REFRESH_EXPIRATION: int = 604800
    JWT_ALGORITHM: str = "RS256"
    
    # App
    PORT: int = 8001
    APP_NAME: str = "Healthcare Auth Service"
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore" 

settings = Settings()