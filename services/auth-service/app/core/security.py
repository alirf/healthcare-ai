import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.config import settings

# Argon2 برای هش رمز عبور
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def load_private_key() -> str:
    with open(settings.JWT_PRIVATE_KEY_PATH, "r") as f:
        return f.read()

def load_public_key() -> str:
    with open(settings.JWT_PUBLIC_KEY_PATH, "r") as f:
        return f.read()

def create_access_token(user_id: str, role: str, phone_verified: bool) -> str:
    private_key = load_private_key()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "phone_verified": phone_verified,
        "iat": now,
        "exp": now + timedelta(seconds=settings.JWT_ACCESS_EXPIRATION),
        "type": "access",
        "iss": settings.APP_NAME
    }
    return jwt.encode(payload, private_key, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    private_key = load_private_key()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=settings.JWT_REFRESH_EXPIRATION),
        "type": "refresh",
        "iss": settings.APP_NAME
    }
    return jwt.encode(payload, private_key, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    public_key = load_public_key()
    return jwt.decode(token, public_key, algorithms=[settings.JWT_ALGORITHM], issuer=settings.APP_NAME)