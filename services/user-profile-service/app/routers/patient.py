"""Patient profile API endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.schemas.patient import (
    PatientProfileCreate,
    PatientProfileUpdate,
    PatientProfileResponse,
    AllergyCreate,
    AllergyUpdate,
    AllergyResponse,
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    ConditionCreate,
    ConditionUpdate,
    ConditionResponse,
    AvatarResponse,
)
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService
from app.services.audit_service import AuditService
from app.exceptions import (
    ProfileNotFoundError,
    AllergyNotFoundError,
    MedicationNotFoundError,
    ConditionNotFoundError,
    DuplicateAllergyError,
)

router = APIRouter(prefix="/profile/patient", tags=["Patient Profile"])


def get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP and user agent from request."""
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip, user_agent


# =====================================================================
# PATIENT PROFILE ENDPOINTS
# =====================================================================

@router.get("/me", response_model=PatientProfileResponse)
async def get_my_profile(
    request: Request,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get current patient's complete profile with all related data."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    profile = await service.get_patient_profile(user_id)
    
    if not profile:
        raise ProfileNotFoundError()
    
    # Log view for HIPAA compliance
    ip, ua = get_client_info(request)
    await audit.log_view(
        user_id=user_id,
        table_name="patient_profiles",
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return profile


@router.post("/me", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    request: Request,
    profile_data: PatientProfileCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Create patient profile (one-time setup after registration)."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    profile = await service.create_patient_profile(user_id, profile_data)
    
    # Log creation
    ip, ua = get_client_info(request)
    await audit.log_create(
        user_id=user_id,
        table_name="patient_profiles",
        record_id=user_id,
        new_values=profile_data.model_dump(),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return profile


@router.put("/me", response_model=PatientProfileResponse)
async def update_profile(
    request: Request,
    profile_data: PatientProfileUpdate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Update patient profile fields (partial update supported)."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    # Get old values for audit
    old_profile = await service.get_patient_profile(user_id)
    if not old_profile:
        raise ProfileNotFoundError()
    
    profile = await service.update_patient_profile(user_id, profile_data)
    if not profile:
        raise ProfileNotFoundError()
    
    # Log update
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="patient_profiles",
        record_id=user_id,
        old_values={k: getattr(old_profile, k) for k in profile_data.model_dump(exclude_unset=True).keys()},
        new_values=profile_data.model_dump(exclude_unset=True),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return profile


# =====================================================================
# ALLERGY ENDPOINTS
# =====================================================================

@router.post("/me/allergies", response_model=AllergyResponse, status_code=status.HTTP_201_CREATED)
async def add_allergy(
    request: Request,
    allergy: AllergyCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Add a new allergy record."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    try:
        new_allergy = await service.add_allergy(user_id, allergy)
    except DuplicateAllergyError:
        raise
    
    # Log creation
    ip, ua = get_client_info(request)
    await audit.log_create(
        user_id=user_id,
        table_name="patient_allergies",
        record_id=new_allergy.id,
        new_values=allergy.model_dump(),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return new_allergy


@router.get("/me/allergies", response_model=List[AllergyResponse])
async def get_allergies(
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get all allergies for current patient."""
    service = ProfileService(db)
    user_id = UUID(current_user["sub"])
    return await service.get_allergies(user_id)


@router.put("/me/allergies/{allergy_id}", response_model=AllergyResponse)
async def update_allergy(
    request: Request,
    allergy_id: UUID,
    allergy: AllergyUpdate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing allergy."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    # Get old values
    old_allergy = await service.get_allergy(user_id, allergy_id)
    if not old_allergy:
        raise AllergyNotFoundError()
    
    updated = await service.update_allergy(user_id, allergy_id, allergy)
    if not updated:
        raise AllergyNotFoundError()
    
    # Log update
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="patient_allergies",
        record_id=allergy_id,
        old_values={k: getattr(old_allergy, k) for k in allergy.model_dump(exclude_unset=True).keys()},
        new_values=allergy.model_dump(exclude_unset=True),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return updated


@router.delete("/me/allergies/{allergy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allergy(
    request: Request,
    allergy_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Remove an allergy record."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    # Get old values before deletion
    old_allergy = await service.get_allergy(user_id, allergy_id)
    if not old_allergy:
        raise AllergyNotFoundError()
    
    deleted = await service.delete_allergy(user_id, allergy_id)
    if not deleted:
        raise AllergyNotFoundError()
    
    # Log deletion
    ip, ua = get_client_info(request)
    await audit.log_delete(
        user_id=user_id,
        table_name="patient_allergies",
        record_id=allergy_id,
        old_values={"allergy_name": old_allergy.allergy_name, "severity": old_allergy.severity},
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return None


# =====================================================================
# MEDICATION ENDPOINTS
# =====================================================================

@router.post("/me/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def add_medication(
    request: Request,
    medication: MedicationCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Add a new current medication."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    new_medication = await service.add_medication(user_id, medication)
    
    ip, ua = get_client_info(request)
    await audit.log_create(
        user_id=user_id,
        table_name="patient_current_medications",
        record_id=new_medication.id,
        new_values=medication.model_dump(),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return new_medication


@router.get("/me/medications", response_model=List[MedicationResponse])
async def get_medications(
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get all medications for current patient."""
    service = ProfileService(db)
    user_id = UUID(current_user["sub"])
    return await service.get_medications(user_id)


@router.put("/me/medications/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    request: Request,
    medication_id: UUID,
    medication: MedicationUpdate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing medication."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    old_medication = await service.get_medication(user_id, medication_id)
    if not old_medication:
        raise MedicationNotFoundError()
    
    updated = await service.update_medication(user_id, medication_id, medication)
    if not updated:
        raise MedicationNotFoundError()
    
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="patient_current_medications",
        record_id=medication_id,
        old_values={k: getattr(old_medication, k) for k in medication.model_dump(exclude_unset=True).keys()},
        new_values=medication.model_dump(exclude_unset=True),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return updated


@router.delete("/me/medications/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    request: Request,
    medication_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Remove a medication record."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    old_medication = await service.get_medication(user_id, medication_id)
    if not old_medication:
        raise MedicationNotFoundError()
    
    deleted = await service.delete_medication(user_id, medication_id)
    if not deleted:
        raise MedicationNotFoundError()
    
    ip, ua = get_client_info(request)
    await audit.log_delete(
        user_id=user_id,
        table_name="patient_current_medications",
        record_id=medication_id,
        old_values={"medication_name": old_medication.medication_name, "dosage": old_medication.dosage},
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return None


# =====================================================================
# CONDITION ENDPOINTS
# =====================================================================

@router.post("/me/conditions", response_model=ConditionResponse, status_code=status.HTTP_201_CREATED)
async def add_condition(
    request: Request,
    condition: ConditionCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Add a new chronic condition."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    new_condition = await service.add_condition(user_id, condition)
    
    ip, ua = get_client_info(request)
    await audit.log_create(
        user_id=user_id,
        table_name="patient_chronic_conditions",
        record_id=new_condition.id,
        new_values=condition.model_dump(),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return new_condition


@router.get("/me/conditions", response_model=List[ConditionResponse])
async def get_conditions(
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get all chronic conditions for current patient."""
    service = ProfileService(db)
    user_id = UUID(current_user["sub"])
    return await service.get_conditions(user_id)


@router.put("/me/conditions/{condition_id}", response_model=ConditionResponse)
async def update_condition(
    request: Request,
    condition_id: UUID,
    condition: ConditionUpdate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing chronic condition."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    old_condition = await service.get_condition(user_id, condition_id)
    if not old_condition:
        raise ConditionNotFoundError()
    
    updated = await service.update_condition(user_id, condition_id, condition)
    if not updated:
        raise ConditionNotFoundError()
    
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="patient_chronic_conditions",
        record_id=condition_id,
        old_values={k: getattr(old_condition, k) for k in condition.model_dump(exclude_unset=True).keys()},
        new_values=condition.model_dump(exclude_unset=True),
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return updated


@router.delete("/me/conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_condition(
    request: Request,
    condition_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Remove a chronic condition record."""
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    old_condition = await service.get_condition(user_id, condition_id)
    if not old_condition:
        raise ConditionNotFoundError()
    
    deleted = await service.delete_condition(user_id, condition_id)
    if not deleted:
        raise ConditionNotFoundError()
    
    ip, ua = get_client_info(request)
    await audit.log_delete(
        user_id=user_id,
        table_name="patient_chronic_conditions",
        record_id=condition_id,
        old_values={"condition_name": old_condition.condition_name, "severity": old_condition.severity},
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return None


# =====================================================================
# AVATAR ENDPOINTS
# =====================================================================

@router.post("/me/avatar", response_model=AvatarResponse)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Upload a profile picture to object storage.
    
    - Max size: 5MB
    - Allowed types: JPEG, PNG, WebP
    - Returns presigned URL valid for 7 days
    """
    storage = StorageService()
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    # Upload to object storage
    image_url, object_key = await storage.upload_avatar(
        file=file,
        user_id=str(user_id),
        user_type="patient",
    )
    
    # Update profile with new avatar
    # Delete old avatar if exists
    old_profile = await service.get_patient_profile(user_id)
    if old_profile and old_profile.profile_image_key:
        await storage.delete_file(old_profile.profile_image_key)
    
    await service.update_avatar(user_id, image_url, object_key)
    
    # Log update
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="patient_profiles",
        record_id=user_id,
        old_values={"profile_image_url": old_profile.profile_image_url if old_profile else None},
        new_values={"profile_image_url": image_url},
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return AvatarResponse(profile_image_url=image_url)


@router.delete("/me/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(
    request: Request,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Remove profile picture."""
    storage = StorageService()
    service = ProfileService(db)
    audit = AuditService(db)
    
    user_id = UUID(current_user["sub"])
    
    profile = await service.get_patient_profile(user_id)
    if not profile:
        raise ProfileNotFoundError()
    
    if profile.profile_image_key:
        await storage.delete_file(profile.profile_image_key)
    
    await service.update_avatar(user_id, None, None)
    
    ip, ua = get_client_info(request)
    await audit.log_update(
        user_id=user_id,
        table_name="patient_profiles",
        record_id=user_id,
        old_values={"profile_image_url": profile.profile_image_url},
        new_values={"profile_image_url": None},
        performed_by=user_id,
        ip_address=ip,
        user_agent=ua,
    )
    
    return None