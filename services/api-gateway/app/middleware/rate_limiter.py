# app/middleware/rate_limiter.py
import time
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.utils.redis_client import get_redis_client


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, **kwargs):
        super().__init__(app)
        self.redis = get_redis_client()
        self.limits = {
            "public": settings.RATE_LIMIT_PUBLIC,
            "auth": settings.RATE_LIMIT_AUTH,
            "profile": settings.RATE_LIMIT_PROFILE,
            "intake": settings.RATE_LIMIT_INTAKE,
            "records": settings.RATE_LIMIT_RECORD,
        }

    def _get_key(self, identifier: str, window: int) -> str:
        current_window = int(time.time()) // window
        return f"rate_limit:{identifier}:{current_window}"

    async def _check_limit(self, key: str, limit: int, window: int = 60) -> tuple[bool, int, int]:
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()

        current_count = results[0]
        remaining = max(0, limit - current_count)
        reset_after = window - (int(time.time()) % window)

        allowed = current_count <= limit
        return allowed, remaining, reset_after

    async def _enforce(self, request, call_next, identifier: str, limit: int, error_code: str, detail: str):
        allowed, remaining, reset_after = await self._check_limit(self._get_key(identifier, 60), limit)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": detail, "code": error_code, "retry_after": reset_after},
                headers={"Retry-After": str(reset_after)},
            )
        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # مسیرهای عمومی (لاگین/ثبت‌نام) — بر اساس IP، قبل از احراز هویت
        public_paths = ("/api/auth/login", "/api/auth/register", "/api/auth/verify-otp")
        if any(path.startswith(p) for p in public_paths):
            client_ip = request.client.host if request.client else "unknown"
            return await self._enforce(
                request, call_next,
                identifier=f"ip:{client_ip}",
                limit=self.limits["public"],
                error_code="RATE_LIMIT_EXCEEDED",
                detail="Access from this IP address has been rate-limited",
            )

        user_id = getattr(request.state, "user_id", None)

        # مسیرهای محافظت‌شده‌ای که به این‌جا می‌رسند باید user_id داشته باشند
        # (چون JWTValidationMiddleware قبل از این اجرا شده). اگر نداشت، یعنی مسیر
        # عمومی دیگری بوده که نیاز به rate limit خاص کاربر ندارد.
        if not user_id:
            return await call_next(request)

        if path.startswith("/api/profile/"):
            return await self._enforce(
                request, call_next,
                identifier=f"user:{user_id}:profile",
                limit=self.limits["profile"],
                error_code="PROFILE_RATE_LIMIT_EXCEEDED",
                detail="Profile service rate limit exceeded",
            )

        if path.startswith("/api/intake/"):
            return await self._enforce(
                request, call_next,
                identifier=f"user:{user_id}:intake",
                limit=self.limits["intake"],
                error_code="INTAKE_RATE_LIMIT_EXCEEDED",
                detail="Visit intake rate limit exceeded",
            )

        if path.startswith("/api/records/"):
            return await self._enforce(
                request, call_next,
                identifier=f"user:{user_id}:records",
                limit=self.limits["records"],
                error_code="RECORD_RATE_LIMIT_EXCEEDED",
                detail="Medical record rate limit exceeded",
            )

        # محدودیت عمومی برای هر کاربر احراز هویت‌شده روی سایر مسیرها
        return await self._enforce(
            request, call_next,
            identifier=f"user:{user_id}",
            limit=self.limits["auth"],
            error_code="RATE_LIMIT_EXCEEDED",
            detail="Rate limit exceeded for this user",
        )
