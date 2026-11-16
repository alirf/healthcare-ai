# app/main.py
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
    redirect_slashes=False,
)

# ترتیب میدلورها مهم است: آخرین add_middleware = بیرونی‌ترین لایه (اول اجرا می‌شود)
app.add_middleware(LoggingMiddleware)           # ۱. لاگ‌گیری
app.add_middleware(JWTValidationMiddleware)     # ۲. اعتبارسنجی JWT
app.add_middleware(RateLimiterMiddleware)       # ۳. محدودیت نرخ (بعد از JWT!)
app.add_middleware(RoleCheckerMiddleware)       # ۴. بررسی نقش

# CORS باید بیرونی‌ترین لایه باشد تا پیش‌درخواست‌های OPTIONS
# قبل از بررسی JWT/نقش پاسخ بگیرند
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-RateLimit-Remaining", "Retry-After"],
)

# Router
app.include_router(proxy.router)