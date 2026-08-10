import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import User, OTPCode, RefreshToken, LoginAttempt
from app.schemas import (
    UserRegisterRequest, OTPVerifyRequest, LoginRequest, 
    PasswordResetRequest, RefreshTokenRequest
)
from app.core.security import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token, decode_token
)
from app.core.exceptions import (
    InvalidCredentialsException, UserExistsException, 
    OTPExpiredException, OTPInvalidException, RateLimitException
)
from app.core.redis import check_rate_limit, blacklist_token, is_token_blacklisted
from app.auth.utils import generate_otp, hash_otp, verify_otp, get_otp_expiry

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    # ========== ثبت‌نام ==========
    def register(self, data: UserRegisterRequest) -> User:
        existing = self.db.query(User).filter(User.phone_number == data.phone_number).first()
        if existing:
            raise UserExistsException()
        
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
    
    # ========== OTP ==========
    def create_otp(self, phone_number: str, purpose: str, user_id: uuid.UUID = None) -> str:
        code = generate_otp()
        
        # Rate limit: حداکثر 3 OTP در 10 دقیقه
        rate_key = f"otp_rate:{phone_number}"
        if not check_rate_limit(rate_key, limit=3, window=600):
            raise RateLimitException()
        
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
        
        print(f"📱 OTP برای {phone_number}: {code}")
        return code
    
    def verify_otp_code(self, data: OTPVerifyRequest, purpose: str = "REGISTER") -> User:
        otp = self.db.query(OTPCode).filter(
            OTPCode.phone_number == data.phone_number,
            OTPCode.is_used == False,
            OTPCode.purpose == purpose
        ).order_by(OTPCode.created_at.desc()).first()
        
        if not otp:
            raise OTPInvalidException()
        
        if otp.expires_at < datetime.now(timezone.utc):
            raise OTPExpiredException()
        
        if not verify_otp(data.code, otp.code_hash):
            raise OTPInvalidException()
        
        user = self.db.query(User).filter(User.phone_number == data.phone_number).first()
        if not user:
            raise InvalidCredentialsException()
        
        if purpose == "REGISTER":
            user.is_phone_verified = True
        
        otp.is_used = True
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    # ========== ورود با رمز عبور ==========
    def login(self, data: LoginRequest, ip_address: str = None) -> dict:
        # Rate limit: حداکثر 5 تلاش در 15 دقیقه
        rate_key = f"login_rate:{data.phone_number}"
        if not check_rate_limit(rate_key, limit=5, window=900):
            raise RateLimitException()
        
        user = self.db.query(User).filter(User.phone_number == data.phone_number).first()
        
        # ثبت تلاش ورود
        attempt = LoginAttempt(
            id=uuid.uuid4(),
            phone_number=data.phone_number,
            ip_address=ip_address,
            success=False
        )
        self.db.add(attempt)
        
        # پیام یکسان برای جلوگیری از user enumeration
        if not user or not verify_password(data.password, user.password_hash):
            self.db.commit()
            raise InvalidCredentialsException()
        
        if not user.is_active:
            self.db.commit()
            raise InvalidCredentialsException()
        
        if not user.is_phone_verified:
            self.db.commit()
            raise InvalidCredentialsException()
        
        attempt.success = True
        self.db.commit()
        
        return self._generate_tokens(user)
    
    # ========== ورود با OTP ==========
    def login_with_otp(self, data: OTPVerifyRequest) -> dict:
        user = self.verify_otp_code(data, purpose="LOGIN")
        return self._generate_tokens(user)
    
    # ========== تمدید توکن ==========
    def refresh_access_token(self, data: RefreshTokenRequest) -> dict:
        try:
            payload = decode_token(data.refresh_token)
            if payload.get("type") != "refresh":
                raise InvalidCredentialsException()
            
            user_id = payload.get("sub")
            user = self.db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.is_active:
                raise InvalidCredentialsException()
            
            # بررسی لیست سیاه
            jti = payload.get("jti") or str(uuid.uuid4())
            if is_token_blacklisted(jti):
                raise InvalidCredentialsException()
            
            # بررسی Refresh Token در دیتابیس
            token_hash = hash_password(data.refresh_token)
            rt = self.db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            ).first()
            
            if not rt:
                raise InvalidCredentialsException()
            
            # ابطال refresh token قبلی
            rt.revoked = True
            self.db.commit()
            
            return self._generate_tokens(user)
            
        except Exception:
            raise InvalidCredentialsException()
    
    # ========== خروج ==========
    def logout(self, user_id: str, refresh_token: str = None):
        if refresh_token:
            try:
                payload = decode_token(refresh_token)
                jti = payload.get("jti") or str(uuid.uuid4())
                exp = payload.get("exp", 0)
                now = int(datetime.now(timezone.utc).timestamp())
                ttl = max(exp - now, 60)
                blacklist_token(jti, ttl)
                
                # ابطال در دیتابیس
                token_hash = hash_password(refresh_token)
                self.db.query(RefreshToken).filter(
                    RefreshToken.token_hash == token_hash
                ).update({"revoked": True})
                self.db.commit()
            except Exception:
                pass
        
        return {"message": "با موفقیت خارج شدید"}
    
    # ========== بازیابی رمز عبور ==========
    def reset_password(self, data: PasswordResetRequest) -> dict:
        user = self.verify_otp_code(
            OTPVerifyRequest(phone_number=data.phone_number, code=data.code),
            purpose="RESET_PASSWORD"
        )
        
        user.password_hash = hash_password(data.new_password)
        self.db.commit()
        
        # ابطال همه refresh tokenها
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id
        ).update({"revoked": True})
        self.db.commit()
        
        return {"message": "رمز عبور با موفقیت تغییر کرد"}
    
    # ========== توکن‌ها ==========
    def _generate_tokens(self, user: User) -> dict:
        access_token = create_access_token(user.id, user.role, user.is_phone_verified)
        refresh_token = create_refresh_token(user.id)
        
        # ذخیره refresh token
        rt = RefreshToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=hash_password(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        self.db.add(rt)
        self.db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 900,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "phone_number": user.phone_number,
                "role": user.role,
                "is_phone_verified": user.is_phone_verified
            }
        }
    
    # ========== دریافت کاربر ==========
    def get_user_by_id(self, user_id: uuid.UUID) -> User:
        return self.db.query(User).filter(User.id == user_id).first()