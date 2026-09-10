"""Internal API endpoints for AI services and medical-record-service.

NOT exposed through the Gateway (gateway blocks /internal/* paths).
Called by:
- Persian Medical Evidence Extractor (symptom detection)
- AI diagnostic service (disease suggestions)
- AI prescription service (prescription drafts)
- medical-record-service (record sync hooks)
All requests require the X-Internal-API-Key header.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import verify_internal_api_key
from app.exceptions import VisitNotFoundError
from app.models.visit import Visit
from app.schemas.visit import VisitStatusUpdate, MedicalRecordLink, VisitResponse
from app.schemas.clinical import (
    SymptomResponse,
    AISymptomsBulkInput,
    DiseaseSuggestionResponse,
    DiseaseSuggestionsBulkInput,
    AIPrescriptionDraftInput,
    AIPrescriptionDraftResponse,
)
from app.schemas.internal import VisitContextResponse
from app.services.visit_service import VisitService
from app.services.record_sync import sync_visit_to_record

router = APIRouter(prefix="/internal/intake", tags=["Internal (AI + Records)"])


async def get_visit_or_404(visit_id: UUID, db: AsyncSession):
    service = VisitService(db)
    visit = await service.get_visit(visit_id)
    if not visit:
        raise VisitNotFoundError()
    return visit


@router.get("/visits/{visit_id}/context", response_model=VisitContextResponse)
async def get_visit_context(
    visit_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Full visit data for AI processing (messages + symptoms + everything)."""
    visit = await get_visit_or_404(visit_id, db)
    return VisitContextResponse(
        visit=visit,
        messages=visit.messages,
        symptoms=visit.symptoms,
        disease_suggestions=visit.disease_suggestions,
        prescription_drafts=visit.prescription_drafts,
        chat_messages=visit.chat_messages,
        final_prescription=visit.final_prescription,
    )


@router.post("/visits/{visit_id}/symptoms/ai", response_model=List[SymptomResponse], status_code=status.HTTP_201_CREATED)
async def add_ai_symptoms(
    visit_id: UUID,
    payload: AISymptomsBulkInput,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Store AI-detected symptoms (duplicates are skipped)."""
    service = VisitService(db)
    await get_visit_or_404(visit_id, db)
    return await service.bulk_add_ai_symptoms(visit_id, payload)


@router.post("/visits/{visit_id}/disease-suggestions", response_model=List[DiseaseSuggestionResponse], status_code=status.HTTP_201_CREATED)
async def submit_disease_suggestions(
    visit_id: UUID,
    payload: DiseaseSuggestionsBulkInput,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Store AI-suggested probable diseases for the doctor (replaces previous list)."""
    service = VisitService(db)
    await get_visit_or_404(visit_id, db)
    return await service.replace_disease_suggestions(visit_id, payload)


@router.post("/visits/{visit_id}/prescription-draft", response_model=AIPrescriptionDraftResponse, status_code=status.HTTP_201_CREATED)
async def submit_prescription_draft(
    visit_id: UUID,
    payload: AIPrescriptionDraftInput,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Store the AI prescription draft for the doctor to edit."""
    service = VisitService(db)
    await get_visit_or_404(visit_id, db)
    return await service.save_draft(visit_id, payload)


@router.put("/visits/{visit_id}/status", response_model=VisitResponse)
async def update_visit_status(
    visit_id: UUID,
    data: VisitStatusUpdate,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """AI pipeline updates the visit status, e.g. ai_processing -> doctor_assigned."""
    service = VisitService(db)
    visit = await get_visit_or_404(visit_id, db)
    return await service.transition(visit, data.status)


@router.put("/visits/{visit_id}/medical-record", response_model=VisitResponse)
async def link_medical_record(
    visit_id: UUID,
    data: MedicalRecordLink,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Link the visit to a medical record and sync it to medical-record-service."""
    service = VisitService(db)
    visit = await get_visit_or_404(visit_id, db)
    visit = await service.link_medical_record(visit, data.medical_record_id)

    # ── sync hook: register the visit in the record's junction table ──
    await sync_visit_to_record(
        medical_record_id=data.medical_record_id,
        visit_id=visit.id,
        patient_id=visit.patient_id,
    )

    return visit


# =====================================================================
# medical-record-service hooks
# =====================================================================

@router.get("/records/{record_id}/visits", response_model=List[VisitResponse])
async def list_record_visits(
    record_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """All visits linked to a medical record (medical-record-service delegates here)."""
    result = await db.execute(
        select(Visit)
        .where(Visit.medical_record_id == record_id)
        .order_by(Visit.started_at.asc())
    )
    return result.scalars().all()


@router.get("/doctor/{doctor_id}/patient-ids")
async def list_doctor_patient_ids(
    doctor_id: UUID,
    _: bool = Depends(verify_internal_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Distinct patient IDs this doctor has at least one visit with.

    Used by medical-record-service for the minimal doctor view.
    """
    result = await db.execute(
        select(Visit.patient_id)
        .where(Visit.doctor_id == doctor_id)
        .distinct()
    )
    return {"patient_ids": [str(pid) for pid in result.scalars().all()]}
