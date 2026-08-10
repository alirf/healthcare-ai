import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import User, OTPCode, RefreshToken, LoginAttempt
from app.schemas import UserRegisterRequest, OTPVerifyRequest, LoginRequest, PasswordResetRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import InvalidCredentialsException, UserExistsException, OTPExpiredException, OTPInvalidException
from app.auth.utils import generate_otp, hash_otp, verify_otp, get_otp_expiry

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def register(self, data: UserRegisterRequest) -> User:
        """ثبت‌نام کاربر جدید"""
        # بررسی وجود کاربر
        existing = self.db.query(User).filter(User.phone_number == data.phone_number).first()
        if existing:
            raise UserExistsException()
        
        # ساخت کاربر (is_phone_verified=False)
        user = User(
            id=uuid.uuid4(),
            phone_number=data.phone_number,
            email=data.email,
            password_hash=hash_password(data.password),
            role=data.role,
            is_phone_verified=False
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def create_otp(self, phone_number: str, purpose: str, user_id: uuid.UUID = None) -> str:
        """تولید و ذخیره OTP"""
        code = generate_otp()
        
        # غیرفعال کردن OTPهای قبلی
        self.db.query(OTPCode).filter(
            OTPCode.phone_number == phone_number,
            OTPCode.purpose == purpose,
            OTPCode.is_used == False
        ).update({"is_used": True})
        
        otp = OTPCode(
            id=uuid.uuid4(),
            user_id=user_id,
            phone_number=phone_number,
            code_hash=hash_otp(code),
            purpose=purpose,
            expires_at=get_otp_expiry()
        )
        self.db.add(otp)
        self.db.commit()
        
        # TODO: ارسال SMS واقعی
        print(f"📱 OTP برای {phone_number}: {code}")
        
        return code
    
    def verify_otp_code(self, data: OTPVerifyRequest) -> User:
        """تایید OTP و فعال‌سازی کاربر"""
        otp = self.db.query(OTPCode).filter(
            OTPCode.phone_number == data.phone_number,
            OTPCode.is_used == False,
            OTPCode.purpose == "REGISTER"
        ).order_by(OTPCode.created_at.desc()).first()
        
        if not otp:
            raise OTPInvalidException()
        
        if otp.expires_at < datetime.now(timezone.utc):
            raise OTPExpiredException()
        
        if not verify_otp(data.code, otp.code_hash):
            raise OTPInvalidException()
        
        # فعال‌سازی کاربر
        user = self.db.query(User).filter(User.phone_number == data.phone_number).first()
        if not user:
            raise InvalidCredentialsException()
        
        user.is_phone_verified = True
        otp.is_used = True
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def login(self, data: LoginRequest) -> dict:
        """ورود با رمز عبور"""
        user = self.db.query(User).filter(User.phone_number == data.phone_number).first()
        
        # ثبت تلاش ورود
        attempt = LoginAttempt(
            id=uuid.uuid4(),
            phone_number=data.phone_number,
            success=False
        )
        self.db.add(attempt)
        
        if not user or not verify_password(data.password, user.password_hash):
            self.db.commit()
            raise InvalidCredentialsException()
        
        if not user.is_active:
            self.db.commit()
            raise InvalidCredentialsException()
        
        attempt.success = True
        self.db.commit()
        
        # تولید توکن‌ها
        access_token = create_access_token(user.id, user.role, user.is_phone_verified)
        refresh_token = create_refresh_token(user.id)
        
        # ذخیره refresh token
        rt = RefreshToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=hash_password(refresh_token),
            expires_at=datetime.now(timezone.utc) + __import__('datetime').timedelta(days=7)
        )
        self.db.add(rt)
        self.db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 900,
            "user": {
                "id": str(user.id),
                "phone_number": user.phone_number,
                "role": user.role,
                "is_phone_verified": user.is_phone_verified
            }
        }
    
    def get_user_by_id(self, user_id: uuid.UUID) -> User:
        """دریافت کاربر با ID"""
        return self.db.query(User).filter(User.id == user_id).first()