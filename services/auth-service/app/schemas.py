from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserRegisterRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^09\d{9}$", description="شماره موبایل ایرانی")
    password: str = Field(..., min_length=8, max_length=128)
    email: Optional[EmailStr] = None
    role: str = Field(default="PATIENT", pattern=r"^(PATIENT|DOCTOR|ADMIN)$")

class OTPVerifyRequest(BaseModel):
    phone_number: str
    code: str = Field(..., min_length=4, max_length=6)

class LoginRequest(BaseModel):
    phone_number: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: UUID
    phone_number: str
    email: Optional[str]
    role: str
    is_phone_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OTPRequest(BaseModel):
    phone_number: str
    purpose: str = Field(default="REGISTER", pattern=r"^(REGISTER|LOGIN|RESET_PASSWORD)$")

class PasswordResetRequest(BaseModel):
    phone_number: str
    code: str
    new_password: str = Field(..., min_length=8, max_length=128)

class RefreshTokenRequest(BaseModel):
    refresh_token: str