"""Doctor profile API endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.schemas.doctor import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileResponse,
)
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService
from app.services.audit_service import AuditService
from app.exceptions import ProfileNotFoundError

router = APIRouter(prefix="/profile/doctor", tags=["Doctor Profile"])


def get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP and user agent from request."""
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip, user_agent


@router.get("/me", response_model=DoctorProfileResponse)
async def get_my_doctor_profile(
    request: Request,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Get current doctor's profile."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    profile = await service.get_doctor_profile(user_id)
    
    if not profile:
        raise ProfileNotFoundError()
    
    ip, ua = get_client_info(request)
    await audit.log_view(
        user_id=user_id,
        table_name="doctor_profiles",
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return profile


@router.post("/me", response_model=DoctorProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor_profile(
    request: Request,
    profile_data: DoctorProfileCreate,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Create doctor profile (one-time setup after registration)."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    profile = await service.create_doctor_profile(user_id, profile_data)
    
    ip, ua = get_client_info(request)
    await audit.log_create(
        user_id=user_id,
        table_name="doctor_profiles",
        record_id=user_id,
        new_values=profile_data.model_dump(),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return profile


@router.put("/me", response_model=DoctorProfileResponse)
async def update_doctor_profile(
    request: Request,
    profile_data: DoctorProfileUpdate,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Update doctor profile fields (partial update supported)."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    old_profile = await service.get_doctor_profile(user_id)
    if not old_profile:
        raise ProfileNotFoundError()
    
    profile = await service.update_doctor_profile(user_id, profile_data)
    if not profile:
        raise ProfileNotFoundError()
    
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="doctor_profiles",
        record_id=user_id,
        old_values={k: getattr(old_profile, k) for k in profile_data.model_dump(exclude_unset=True).keys()},
        new_values=profile_data.model_dump(exclude_unset=True),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return profile


@router.post("/me/avatar")
async def upload_doctor_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Upload doctor profile picture."""
    storage = StorageService()
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    image_url, object_key = await storage.upload_avatar(
        file=file,
        user_id=str(user_id),
        user_type="doctor",
    )
    
    old_profile = await service.get_doctor_profile(user_id)
    if old_profile and old_profile.profile_image_key:
        await storage.delete_file(old_profile.profile_image_key)
    
    # Note: need to add update_doctor_avatar to ProfileService
    # For now using direct update
    result = await db.execute(
        select(DoctorProfile).where(DoctorProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.profile_image_url = image_url
        profile.profile_image_key = object_key
        await db.flush()
    
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="doctor_profiles",
        record_id=user_id,
        old_values={"profile_image_url": old_profile.profile_image_url if old_profile else None},
        new_values={"profile_image_url": image_url},
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return {"profile_image_url": image_url}