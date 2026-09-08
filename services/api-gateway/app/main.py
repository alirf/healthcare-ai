# app/main.py (بدون تغییر)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.jwt_validation import JWTValidationMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.role_checker import RoleCheckerMiddleware
from app.router import proxy


app = FastAPI(
    title="Healthcare AI - API Gateway",
    description="API Gateway for Healthcare AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-RateLimit-Remaining", "Retry-After"]
)

# Middlewareها (ترتیب مهم است!)
app.add_middleware(LoggingMiddleware)           # ۱. لاگ‌گیری
app.add_middleware(RateLimiterMiddleware)       # ۲. محدودیت نرخ
app.add_middleware(JWTValidationMiddleware)     # ۳. اعتبارسنجی JWT
app.add_middleware(RoleCheckerMiddleware)       # ۴. بررسی نقش

# Router
app.include_router(proxy.router)