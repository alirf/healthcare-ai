import redis
from app.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis():
    return redis_client

def set_rate_limit(key: str, limit: int, window: int):
    """تنظیم محدودیت نرخ"""
    current = redis_client.get(key)
    if current is None:
        redis_client.setex(key, window, 1)
        return True, limit - 1
    current = int(current)
    if current >= limit:
        return False, 0
    redis_client.incr(key)
    return True, limit - current - 1

def check_rate_limit(key: str, limit: int = 5, window: int = 900) -> bool:
    """بررسی محدودیت نرخ (پیش‌فرض: 5 بار در 15 دقیقه)"""
    allowed, remaining = set_rate_limit(key, limit, window)
    return allowed

def blacklist_token(token_jti: str, expiry: int):
    """افزودن توکن به لیست سیاه"""
    redis_client.setex(f"blacklist:{token_jti}", expiry, "1")

def is_token_blacklisted(token_jti: str) -> bool:
    """بررسی لیست سیاه"""
    return redis_client.exists(f"blacklist:{token_jti}") == 1

def cache_otp(phone: str, code: str, expiry: int = 300):
    """ذخیره OTP در Redis"""
    redis_client.setex(f"otp:{phone}", expiry, code)

def get_cached_otp(phone: str) -> str:
    """دریافت OTP از Redis"""
    return redis_client.get(f"otp:{phone}")

def delete_cached_otp(phone: str):
    """حذف OTP از Redis"""
    redis_client.delete(f"otp:{phone}")