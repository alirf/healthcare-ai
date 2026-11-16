# app/utils/redis_client.py
import redis.asyncio as redis
from app.config import settings


def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL, decode_responses=True)