from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    UserRegisterRequest, OTPVerifyRequest, LoginRequest, 
    TokenResponse, UserResponse, OTPRequest, RefreshTokenRequest
)
from app.auth.service import AuthService
from app.auth.dependencies import get_current_user
from app.core.exceptions import AuthException
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegisterRequest, db: Session = Depends(get_db)):
    """ثبت‌نام کاربر جدید"""
    service = AuthService(db)
    user = service.register(data)
    
    # ارسال OTP
    service.create_otp(data.phone_number, "REGISTER", user.id)
    
    return {
        "message": "کد تایید به شماره موبایل ارسال شد",
        "user_id": str(user.id)
    }

@router.post("/verify-otp")
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    """تایید کد OTP و فعال‌سازی حساب"""
    service = AuthService(db)
    user = service.verify_otp_code(data)
    
    # صدور توکن
    from app.core.security import create_access_token, create_refresh_token
    access_token = create_access_token(user.id, user.role, user.is_phone_verified)
    refresh_token = create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "phone_number": user.phone_number,
            "role": user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """ورود با رمز عبور"""
    service = AuthService(db)
    return service.login(data)

@router.post("/login/otp/request")
def request_login_otp(data: OTPRequest, db: Session = Depends(get_db)):
    """درخواست ورود با OTP"""
    service = AuthService(db)
    user = db.query(User).filter(User.phone_number == data.phone_number).first()
    if not user:
        return {"message": "در صورت وجود حساب، کد ارسال می‌شود"}
    
    service.create_otp(data.phone_number, "LOGIN", user.id)
    return {"message": "کد ورود به شماره موبایل ارسال شد"}

@router.post("/login/otp/verify")
def verify_login_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    """تایید OTP ورود"""
    service = AuthService(db)
    # TODO: پیاده‌سازی کامل
    return {"message": "ورود با موفقیت انجام شد"}

@router.post("/refresh")
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """تمدید Access Token"""
    # TODO: پیاده‌سازی کامل
    return {"message": "تمدید توکن"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """خروج از حساب"""
    # TODO: ابطال refresh token
    return {"message": "با موفقیت خارج شدید"}

@router.post("/forgot-password")
def forgot_password(data: OTPRequest, db: Session = Depends(get_db)):
    """درخواست بازیابی رمز عبور"""
    service = AuthService(db)
    user = db.query(User).filter(User.phone_number == data.phone_number).first()
    if user:
        service.create_otp(data.phone_number, "RESET_PASSWORD", user.id)
    return {"message": "در صورت وجود حساب، کد بازیابی ارسال می‌شود"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """اطلاعات کاربر لاگین‌شده"""
    return current_user