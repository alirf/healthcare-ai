"""Internal API endpoints for AI services (NOT exposed through the Gateway).

Called by:
- Persian Medical Evidence Extractor (symptom detection)
- AI diagnostic service (disease suggestions)
- AI prescription service (prescription drafts)
All requests require the X-Internal-API-Key header.
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import verify_internal_api_key
from app.exceptions import VisitNotFoundError
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

router = APIRouter(prefix="/internal/intake", tags=["Internal (AI Services)"])


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
    """Link the visit to a medical record (used later by the medical-record service)."""
    service = VisitService(db)
    visit = await get_visit_or_404(visit_id, db)
    return await service.link_medical_record(visit, data.medical_record_id)
