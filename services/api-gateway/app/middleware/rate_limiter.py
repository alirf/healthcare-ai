import time
from fastapi import Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.utils.redis_client import get_redis_client


class RateLimiterMiddleware:
    def __init__(self):
        self.redis = get_redis_client()
        self.public_limit = settings.RATE_LIMIT_PUBLIC
        self.auth_limit = settings.RATE_LIMIT_AUTH
        self.ai_triage_limit = settings.RATE_LIMIT_AI_TRIAGE
    
    def _get_key(self, identifier: str, window: int) -> str:
        """ساخت کلید Redis با پنجره زمانی"""
        current_window = int(time.time()) // window
        return f"rate_limit:{identifier}:{current_window}"
    
    def _check_limit(self, key: str, limit: int, window: int = 60) -> tuple[bool, int, int]:
        """
        بررسی محدودیت با الگوریتم Fixed Window
        Returns: (allowed, remaining, reset_after)
        """
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        results = pipe.execute()
        
        current_count = results[0]
        remaining = max(0, limit - current_count)
        reset_after = window - (int(time.time()) % window)
        
        allowed = current_count <= limit
        return allowed, remaining, reset_after
    
    async def __call__(self, request: Request, call_next):
        path = request.url.path
        
        # مسیرهای عمومی (لاگین/ثبت‌نام) - محدودیت IP-based
        public_paths = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-otp"]
        if any(path.startswith(p) for p in public_paths):
            identifier = f"ip:{request.client.host}"
            allowed, remaining, reset_after = self._check_limit(
                self._get_key(identifier, 60), self.public_limit
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "تعداد درخواست‌ها بیش از حد مجاز است",
                        "code": "RATE_LIMIT_EXCEEDED",
                        "retry_after": reset_after
                    },
                    headers={"Retry-After": str(reset_after)}
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response
        
        # مسیر AI Triage - محدودیت سخت‌گیرانه
        if path.startswith("/api/intake/") and "ai" in path:
            user_id = getattr(request.state, "user_id", None)
            if user_id:
                identifier = f"user:{user_id}:ai"
                allowed, remaining, reset_after = self._check_limit(
                    self._get_key(identifier, 60), self.ai_triage_limit
                )
                if not allowed:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": "تعداد درخواست‌های AI بیش از حد مجاز است",
                            "code": "AI_RATE_LIMIT_EXCEEDED",
                            "retry_after": reset_after
                        },
                        headers={"Retry-After": str(reset_after)}
                    )
                response = await call_next(request)
                response.headers["X-RateLimit-Remaining"] = str(remaining)
                return response
        
        # مسیرهای احراز هویت‌شده عادی - محدودیت user-based
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            identifier = f"user:{user_id}"
            allowed, remaining, reset_after = self._check_limit(
                self._get_key(identifier, 60), self.auth_limit
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "تعداد درخواست‌ها بیش از حد مجاز است",
                        "code": "RATE_LIMIT_EXCEEDED",
                        "retry_after": reset_after
                    },
                    headers={"Retry-After": str(reset_after)}
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response
        
        return await call_next(request)