from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    UserRegisterRequest, OTPVerifyRequest, LoginRequest, 
    TokenResponse, UserResponse, OTPRequest, RefreshTokenRequest,
    PasswordResetRequest
)
from app.auth.service import AuthService
from app.auth.dependencies import get_current_user
from app.core.exceptions import AuthException
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ========== ثبت‌نام ==========
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.register(data)
    service.create_otp(data.phone_number, "REGISTER", user.id)
    return {
        "message": "کد تایید به شماره موبایل ارسال شد",
        "user_id": str(user.id)
    }

@router.post("/verify-otp")
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.verify_otp_code(data, "REGISTER")
    tokens = service._generate_tokens(user)
    return tokens

# ========== ورود ==========
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    service = AuthService(db)
    client_ip = request.client.host
    return service.login(data, client_ip)

@router.post("/login/otp/request")
def request_login_otp(data: OTPRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = db.query(User).filter(User.phone_number == data.phone_number).first()
    if user:
        service.create_otp(data.phone_number, "LOGIN", user.id)
    return {"message": "در صورت وجود حساب، کد ورود ارسال می‌شود"}

@router.post("/login/otp/verify")
def verify_login_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login_with_otp(data)

# ========== تمدید توکن ==========
@router.post("/refresh")
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.refresh_access_token(data)

# ========== خروج ==========
@router.post("/logout")
def logout(
    data: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    return service.logout(str(current_user.id), data.refresh_token)

# ========== بازیابی رمز عبور ==========
@router.post("/forgot-password")
def forgot_password(data: OTPRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = db.query(User).filter(User.phone_number == data.phone_number).first()
    if user:
        service.create_otp(data.phone_number, "RESET_PASSWORD", user.id)
    return {"message": "در صورت وجود حساب، کد بازیابی ارسال می‌شود"}

@router.post("/reset-password")
def reset_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.reset_password(data)

# ========== اطلاعات کاربر ==========
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user