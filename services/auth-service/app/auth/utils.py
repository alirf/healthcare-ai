import random
import hashlib
from datetime import datetime, timedelta, timezone
from app.core.security import hash_password

def generate_otp() -> str:
    """تولید کد ۶ رقمی"""
    return str(random.randint(100000, 999999))

def hash_otp(code: str) -> str:
    """هش کردن OTP برای ذخیره در دیتابیس"""
    return hashlib.sha256(code.encode()).hexdigest()

def verify_otp(plain_code: str, hashed_code: str) -> bool:
    """بررسی صحت OTP"""
    return hash_otp(plain_code) == hashed_code

def get_otp_expiry(minutes: int = 5) -> datetime:
    """زمان انقضای OTP"""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)