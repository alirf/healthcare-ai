"""Business logic for patient and doctor profiles."""
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, exists, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.patient import (
    PatientProfile,
    PatientAllergy,
    PatientMedication,
    PatientChronicCondition,
)
from app.models.doctor import DoctorProfile
from app.schemas.patient import (
    PatientProfileCreate,
    PatientProfileUpdate,
    AllergyCreate,
    AllergyUpdate,
    MedicationCreate,
    MedicationUpdate,
    ConditionCreate,
    ConditionUpdate,
    MedicalSummaryResponse,
)
from app.schemas.doctor import DoctorProfileCreate, DoctorProfileUpdate
from app.exceptions import (
    ProfileNotFoundError,
    ProfileAlreadyExistsError,
    AllergyNotFoundError,
    DuplicateAllergyError,
    MedicationNotFoundError,
    ConditionNotFoundError,
)


class ProfileService:
    """Service layer for profile operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # =====================================================================
    # PATIENT PROFILE OPERATIONS
    # =====================================================================
    
    async def get_patient_profile(self, user_id: UUID) -> Optional[PatientProfile]:
        """Get patient profile with all related data eagerly loaded."""
        result = await self.db.execute(
            select(PatientProfile)
            .options(
                selectinload(PatientProfile.allergies),
                selectinload(PatientProfile.medications),
                selectinload(PatientProfile.conditions),
            )
            .where(PatientProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def patient_profile_exists(self, user_id: UUID) -> bool:
        """Check if a patient profile exists."""
        result = await self.db.execute(
            select(exists().where(PatientProfile.user_id == user_id))
        )
        return result.scalar()
    
    async def create_patient_profile(
        self, user_id: UUID, data: PatientProfileCreate
    ) -> PatientProfile:
        """Create a new patient profile."""
        # Check if profile already exists
        if await self.patient_profile_exists(user_id):
            raise ProfileAlreadyExistsError()
        
        profile = PatientProfile(
            user_id=user_id,
            **data.model_dump(),
        )
        self.db.add(profile)
        await self.db.flush()
        return profile
    
    async def update_patient_profile(
        self, user_id: UUID, data: PatientProfileUpdate
    ) -> Optional[PatientProfile]:
        """Update patient profile fields. Only updates provided fields."""
        result = await self.db.execute(
            select(PatientProfile).where(PatientProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        await self.db.flush()
        return profile
    
    async def delete_patient_profile(self, user_id: UUID) -> bool:
        """Delete a patient profile and all related records (cascade)."""
        result = await self.db.execute(
            select(PatientProfile).where(PatientProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return False
        
        await self.db.delete(profile)
        await self.db.flush()
        return True
    
    async def update_avatar(
        self, user_id: UUID, image_url: str, image_key: str
    ) -> Optional[PatientProfile]:
        """Update patient avatar URL and storage key."""
        result = await self.db.execute(
            select(PatientProfile).where(PatientProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        
        profile.profile_image_url = image_url
        profile.profile_image_key = image_key
        await self.db.flush()
        return profile
    
    # =====================================================================
    # ALLERGY OPERATIONS
    # =====================================================================
    
    async def get_allergies(self, user_id: UUID) -> list[PatientAllergy]:
        """Get all allergies for a patient."""
        result = await self.db.execute(
            select(PatientAllergy)
            .where(PatientAllergy.user_id == user_id)
            .order_by(PatientAllergy.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_allergy(self, user_id: UUID, allergy_id: UUID) -> Optional[PatientAllergy]:
        """Get a specific allergy by ID."""
        result = await self.db.execute(
            select(PatientAllergy).where(
                and_(
                    PatientAllergy.user_id == user_id,
                    PatientAllergy.id == allergy_id,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def add_allergy(self, user_id: UUID, data: AllergyCreate) -> PatientAllergy:
        """Add a new allergy. Checks for duplicates."""
        # Check for duplicate allergy name (case-insensitive)
        result = await self.db.execute(
            select(PatientAllergy).where(
                and_(
                    PatientAllergy.user_id == user_id,
                    PatientAllergy.allergy_name.ilike(data.allergy_name),
                )
            )
        )
        if result.scalar_one_or_none():
            raise DuplicateAllergyError()
        
        allergy = PatientAllergy(user_id=user_id, **data.model_dump())
        self.db.add(allergy)
        await self.db.flush()
        return allergy
    
    async def update_allergy(
        self, user_id: UUID, allergy_id: UUID, data: AllergyUpdate
    ) -> Optional[PatientAllergy]:
        """Update an existing allergy."""
        allergy = await self.get_allergy(user_id, allergy_id)
        if not allergy:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(allergy, field, value)
        
        await self.db.flush()
        return allergy
    
    async def delete_allergy(self, user_id: UUID, allergy_id: UUID) -> bool:
        """Delete an allergy."""
        allergy = await self.get_allergy(user_id, allergy_id)
        if not allergy:
            return False
        
        await self.db.delete(allergy)
        await self.db.flush()
        return True
    
    # =====================================================================
    # MEDICATION OPERATIONS
    # =====================================================================
    
    async def get_medications(self, user_id: UUID) -> list[PatientMedication]:
        """Get all medications for a patient."""
        result = await self.db.execute(
            select(PatientMedication)
            .where(PatientMedication.user_id == user_id)
            .order_by(PatientMedication.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_medication(
        self, user_id: UUID, medication_id: UUID
    ) -> Optional[PatientMedication]:
        """Get a specific medication by ID."""
        result = await self.db.execute(
            select(PatientMedication).where(
                and_(
                    PatientMedication.user_id == user_id,
                    PatientMedication.id == medication_id,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def add_medication(
        self, user_id: UUID, data: MedicationCreate
    ) -> PatientMedication:
        """Add a new medication."""
        medication = PatientMedication(user_id=user_id, **data.model_dump())
        self.db.add(medication)
        await self.db.flush()
        return medication
    
    async def update_medication(
        self, user_id: UUID, medication_id: UUID, data: MedicationUpdate
    ) -> Optional[PatientMedication]:
        """Update an existing medication."""
        medication = await self.get_medication(user_id, medication_id)
        if not medication:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(medication, field, value)
        
        await self.db.flush()
        return medication
    
    async def delete_medication(self, user_id: UUID, medication_id: UUID) -> bool:
        """Delete a medication."""
        medication = await self.get_medication(user_id, medication_id)
        if not medication:
            return False
        
        await self.db.delete(medication)
        await self.db.flush()
        return True
    
    # =====================================================================
    # CONDITION OPERATIONS
    # =====================================================================
    
    async def get_conditions(self, user_id: UUID) -> list[PatientChronicCondition]:
        """Get all chronic conditions for a patient."""
        result = await self.db.execute(
            select(PatientChronicCondition)
            .where(PatientChronicCondition.user_id == user_id)
            .order_by(PatientChronicCondition.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_condition(
        self, user_id: UUID, condition_id: UUID
    ) -> Optional[PatientChronicCondition]:
        """Get a specific condition by ID."""
        result = await self.db.execute(
            select(PatientChronicCondition).where(
                and_(
                    PatientChronicCondition.user_id == user_id,
                    PatientChronicCondition.id == condition_id,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def add_condition(
        self, user_id: UUID, data: ConditionCreate
    ) -> PatientChronicCondition:
        """Add a new chronic condition."""
        condition = PatientChronicCondition(user_id=user_id, **data.model_dump())
        self.db.add(condition)
        await self.db.flush()
        return condition
    
    async def update_condition(
        self, user_id: UUID, condition_id: UUID, data: ConditionUpdate
    ) -> Optional[PatientChronicCondition]:
        """Update an existing condition."""
        condition = await self.get_condition(user_id, condition_id)
        if not condition:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(condition, field, value)
        
        await self.db.flush()
        return condition
    
    async def delete_condition(self, user_id: UUID, condition_id: UUID) -> bool:
        """Delete a chronic condition."""
        condition = await self.get_condition(user_id, condition_id)
        if not condition:
            return False
        
        await self.db.delete(condition)
        await self.db.flush()
        return True
    
    # =====================================================================
    # MEDICAL SUMMARY (INTERNAL API)
    # =====================================================================
    
    async def get_medical_summary(self, user_id: UUID) -> Optional[MedicalSummaryResponse]:
        """Generate condensed medical summary for AI services.
        
        This is called automatically at the start of each consultation
        so the patient does not have to re-enter known information.
        """
        profile = await self.get_patient_profile(user_id)
        if not profile:
            return None
        
        # Calculate age from birth_date
        today = date.today()
        age = today.year - profile.birth_date.year
        if (today.month, today.day) < (profile.birth_date.month, profile.birth_date.day):
            age -= 1
        
        # Calculate BMI
        bmi = None
        if profile.height_cm and profile.weight_kg:
            height_m = profile.height_cm / 100
            bmi = round(profile.weight_kg / (height_m ** 2), 1)
        
        # Filter active records only
        active_medications = [m for m in profile.medications if m.is_active]
        active_conditions = [c for c in profile.conditions if c.is_active]
        
        return MedicalSummaryResponse(
            user_id=profile.user_id,
            full_name=profile.full_name,
            age=age,
            gender=profile.gender or "unknown",
            bmi=bmi,
            blood_type=profile.blood_type,
            allergies=[
                {"name": a.allergy_name, "severity": a.severity}
                for a in profile.allergies
            ],
            current_medications=[
                {
                    "name": m.medication_name,
                    "dosage": m.dosage,
                    "frequency": m.frequency,
                    "prescribed_by": m.prescribed_by,
                }
                for m in active_medications
            ],
            chronic_conditions=[
                {
                    "name": c.condition_name,
                    "severity": c.severity,
                    "icd10_code": c.icd10_code,
                }
                for c in active_conditions
            ],
        )
    
    # =====================================================================
    # DOCTOR PROFILE OPERATIONS
    # =====================================================================
    
    async def get_doctor_profile(self, user_id: UUID) -> Optional[DoctorProfile]:
        """Get doctor profile by user ID."""
        result = await self.db.execute(
            select(DoctorProfile).where(DoctorProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def create_doctor_profile(
        self, user_id: UUID, data: DoctorProfileCreate
    ) -> DoctorProfile:
        """Create a new doctor profile."""
        profile = DoctorProfile(
            user_id=user_id,
            **data.model_dump(),
        )
        self.db.add(profile)
        await self.db.flush()
        return profile
    
    async def update_doctor_profile(
        self, user_id: UUID, data: DoctorProfileUpdate
    ) -> Optional[DoctorProfile]:
        """Update doctor profile fields."""
        result = await self.db.execute(
            select(DoctorProfile).where(DoctorProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        await self.db.flush()
        return profile