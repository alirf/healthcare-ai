import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USERNAME: str = "admin"
    DB_PASSWORD: str = "your_secure_password"
    DB_NAME: str = "healthcare_auth"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # JWT
    JWT_PRIVATE_KEY_PATH: str = str(BASE_DIR / "keys" / "private.pem")
    JWT_PUBLIC_KEY_PATH: str = str(BASE_DIR / "keys" / "public.pem")
    JWT_ACCESS_EXPIRATION: int = 900        # 15 دقیقه
    JWT_REFRESH_EXPIRATION: int = 604800    # 7 روز
    JWT_ALGORITHM: str = "RS256"
    
    # App
    PORT: int = 8001
    APP_NAME: str = "Healthcare Auth Service"
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"

settings = Settings()