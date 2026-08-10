from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.models import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """استخراج کاربر فعلی از توکن"""
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="توکن نامعتبر است")
        
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="کاربر یافت نشد")
        
        return user
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="توکن نامعتبر یا منقضی شده")

def get_current_doctor(current_user: User = Depends(get_current_user)) -> User:
    """بررسی نقش پزشک"""
    if current_user.role != "DOCTOR":
        raise HTTPException(status_code=403, detail="دسترسی محدود به پزشکان")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """بررسی نقش ادمین"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="دسترسی محدود به ادمین")
    return current_user