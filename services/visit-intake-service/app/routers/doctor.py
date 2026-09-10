"""Doctor-facing consultation endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.exceptions import (
    VisitNotFoundError,
    SuggestionNotFoundError,
    ForbiddenAccessError,
)
from app.schemas.visit import VisitResponse, VisitListResponse
from app.schemas.clinical import (
    DiseaseSuggestionResponse,
    SuggestionDecisionInput,
    FinalPrescriptionCreate,
    FinalPrescriptionResponse,
)
from app.schemas.internal import VisitContextResponse
from app.services.visit_service import VisitService

router = APIRouter(prefix="/doctor/visits", tags=["Doctor Consultation"])


def get_user_id(current_user: dict) -> UUID:
    return UUID(current_user["sub"])


async def get_doctor_visit(
    visit_id: UUID,
    current_user: dict,
    db: AsyncSession,
):
    """Fetch visit and enforce that it belongs to this doctor."""
    service = VisitService(db)
    visit = await service.get_visit(visit_id)
    if not visit:
        raise VisitNotFoundError()
    if visit.doctor_id != get_user_id(current_user):
        raise ForbiddenAccessError("Visit is not assigned to you")
    return visit


@router.get("/queue", response_model=VisitListResponse)
async def get_queue(
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Visits finished with AI processing and waiting for a doctor."""
    service = VisitService(db)
    visits = await service.list_queue()
    return VisitListResponse(total=len(visits), visits=visits)


@router.get("", response_model=VisitListResponse)
async def list_my_visits(
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Doctor's active visits."""
    service = VisitService(db)
    visits = await service.list_doctor_visits(get_user_id(current_user))
    return VisitListResponse(total=len(visits), visits=visits)


@router.post("/{visit_id}/claim", response_model=VisitResponse)
async def claim_visit(
    visit_id: UUID,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Claim a queued visit -> starts the doctor-patient chat."""
    service = VisitService(db)
    visit = await service.get_visit(visit_id)
    if not visit:
        raise VisitNotFoundError()
    return await service.claim(visit, get_user_id(current_user))


@router.get("/{visit_id}/context", response_model=VisitContextResponse)
async def get_visit_context(
    visit_id: UUID,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Full visit context: patient messages, symptoms, AI suggestions, drafts, chat."""
    visit = await get_doctor_visit(visit_id, current_user, db)
    return VisitContextResponse(
        visit=visit,
        messages=visit.messages,
        symptoms=visit.symptoms,
        disease_suggestions=visit.disease_suggestions,
        prescription_drafts=visit.prescription_drafts,
        chat_messages=visit.chat_messages,
        final_prescription=visit.final_prescription,
    )


@router.put("/{visit_id}/suggestions/{suggestion_id}", response_model=DiseaseSuggestionResponse)
async def decide_suggestion(
    visit_id: UUID,
    suggestion_id: UUID,
    data: SuggestionDecisionInput,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Doctor accepts/rejects an AI disease suggestion."""
    service = VisitService(db)
    await get_doctor_visit(visit_id, current_user, db)
    suggestion = await service.decide_suggestion(
        visit_id, suggestion_id, data.decision, get_user_id(current_user)
    )
    if not suggestion:
        raise SuggestionNotFoundError()
    return suggestion


@router.post("/{visit_id}/prescription", response_model=FinalPrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def issue_final_prescription(
    visit_id: UUID,
    data: FinalPrescriptionCreate,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Doctor issues the final prescription (edited version of the AI draft).
    The visit is automatically marked as completed."""
    service = VisitService(db)
    await get_doctor_visit(visit_id, current_user, db)
    return await service.issue_final_prescription(visit_id, get_user_id(current_user), data)


@router.post("/{visit_id}/complete", response_model=VisitResponse)
async def complete_visit(
    visit_id: UUID,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Manually mark the visit completed (if prescription is handled elsewhere)."""
    service = VisitService(db)
    visit = await get_doctor_visit(visit_id, current_user, db)
    return await service.transition(visit, "completed")


@router.post("/{visit_id}/close", response_model=VisitResponse)
async def close_visit(
    visit_id: UUID,
    current_user: dict = Depends(require_role("doctor")),
    db: AsyncSession = Depends(get_db),
):
    """Close a completed visit (archival step)."""
    service = VisitService(db)
    visit = await get_doctor_visit(visit_id, current_user, db)
    return await service.transition(visit, "closed")
