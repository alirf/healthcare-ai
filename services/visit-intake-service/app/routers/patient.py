"""Patient-facing visit intake endpoints."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.exceptions import (
    VisitNotFoundError,
    SymptomNotFoundError,
    PrescriptionNotFoundError,
    ForbiddenAccessError,
)
from app.schemas.visit import (
    VisitCreate,
    VisitResponse,
    VisitListResponse,
    MessageCreate,
    MessageResponse,
)
from app.schemas.clinical import (
    SymptomCreate,
    SymptomResponse,
    DiseaseSuggestionResponse,
    AIPrescriptionDraftResponse,
    FinalPrescriptionResponse,
)
from app.schemas.nlp import EvidenceExtractionResponse
from app.services.visit_service import VisitService
from app.services.storage_service import StorageService
from app.services.record_sync import sync_visit_to_record
from app.services.evidence_extraction import run_extraction_for_visit

router = APIRouter(prefix="/visits", tags=["Visit Intake"])


def get_user_id(current_user: dict) -> UUID:
    return UUID(current_user["sub"])


async def get_owned_visit(
    visit_id: UUID,
    current_user: dict,
    db: AsyncSession,
):
    """Fetch visit and enforce patient ownership."""
    service = VisitService(db)
    visit = await service.get_visit(visit_id)
    if not visit:
        raise VisitNotFoundError()
    if visit.patient_id != get_user_id(current_user):
        raise ForbiddenAccessError()
    return visit


def _hydrate_message(storage: StorageService, message) -> MessageResponse:
    """Regenerate a fresh presigned URL for file attachments."""
    data = MessageResponse.model_validate(message)
    if message.attachment_key:
        data.attachment_url = storage.get_file_url(message.attachment_key)
    return data


# =====================================================================
# VISIT LIFECYCLE
# =====================================================================

@router.post("", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
async def create_visit(
    data: VisitCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Start a new visit. Optionally attach it to an existing medical record."""
    service = VisitService(db)
    patient_id = get_user_id(current_user)
    visit = await service.create_visit(patient_id, data)

    if visit.medical_record_id is not None:
        await sync_visit_to_record(
            medical_record_id=visit.medical_record_id,
            visit_id=visit.id,
            patient_id=patient_id,
            added_by=patient_id,
        )

    return visit


@router.get("", response_model=VisitListResponse)
async def list_my_visits(
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """List all of the patient's visits (across all medical records)."""
    service = VisitService(db)
    visits = await service.list_patient_visits(get_user_id(current_user))
    return VisitListResponse(total=len(visits), visits=visits)


@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get one of the patient's visits."""
    visit = await get_owned_visit(visit_id, current_user, db)
    return visit


@router.post("/{visit_id}/submit", response_model=VisitResponse)
async def submit_visit(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Patient finished describing symptoms -> hand the visit over to the AI service.

    Before the status flips to ai_processing, the visit's Persian intake text
    is sent to ai-nlp-service (POST /extract) and the detected evidences are
    stored as AI symptoms. The call is fail-safe: if the NLP service is down,
    submission continues without AI symptoms and extraction can be re-run
    later via POST /visits/{visit_id}/extract-evidences.
    """
    service = VisitService(db)
    visit = await get_owned_visit(visit_id, current_user, db)

    # ── AI hook: Persian intake text -> ai-nlp-service -> AI symptom rows ──
    await run_extraction_for_visit(visit_id, db, fail_safe=True)

    return await service.transition(visit, "ai_processing")


@router.post("/{visit_id}/cancel", response_model=VisitResponse)
async def cancel_visit(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Cancel the visit (only possible before/during early stages)."""
    service = VisitService(db)
    visit = await get_owned_visit(visit_id, current_user, db)
    return await service.transition(visit, "cancelled")


# =====================================================================
# INTAKE MESSAGES
# =====================================================================

@router.post("/{visit_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_text_message(
    visit_id: UUID,
    data: MessageCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Send a text message during intake."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    return await service.add_message(visit_id, content=data.content)


@router.post("/{visit_id}/messages/attachment", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_attachment(
    visit_id: UUID,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Send a file (image/PDF/audio/video) during intake, with optional caption."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)

    storage = StorageService()
    attachment = await storage.upload_attachment(file, str(visit_id))
    return await service.add_message(
        visit_id,
        content=caption,
        message_type="file",
        attachment=attachment,
    )


@router.get("/{visit_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get all intake messages of the visit (attachment URLs are fresh presigned URLs)."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    messages = await service.list_messages(visit_id)
    storage = StorageService()
    return [_hydrate_message(storage, m) for m in messages]


# =====================================================================
# MANUAL SYMPTOMS
# =====================================================================

@router.post("/{visit_id}/symptoms", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
async def add_symptom(
    visit_id: UUID,
    data: SymptomCreate,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Patient manually selects a symptom."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    return await service.add_symptom(visit_id, data, source="manual")


@router.get("/{visit_id}/symptoms", response_model=List[SymptomResponse])
async def list_symptoms(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Get all symptoms of the visit (manual + AI-detected)."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    return await service.list_symptoms(visit_id)


@router.delete("/{visit_id}/symptoms/{symptom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_symptom(
    visit_id: UUID,
    symptom_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Remove a manually-added symptom."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    deleted = await service.delete_symptom(visit_id, symptom_id)
    if not deleted:
        raise SymptomNotFoundError()
    return None


# =====================================================================
# AI EVIDENCE EXTRACTION (ai-nlp-service)
# =====================================================================

@router.post("/{visit_id}/extract-evidences", response_model=EvidenceExtractionResponse)
async def extract_evidences(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Send the visit's Persian intake text to ai-nlp-service and get the output.

    The patient's intake messages are aggregated and posted to the NLP
    service; the detected evidences are returned in the response AND stored
    as AI symptoms (source="ai", duplicates skipped).

    Unlike the submit hook, failures are NOT swallowed here: a disabled
    integration or an unreachable ai-nlp-service raises 502 so the caller
    gets explicit feedback.
    """
    await get_owned_visit(visit_id, current_user, db)
    return await run_extraction_for_visit(visit_id, db, fail_safe=False)


# =====================================================================
# READ-ONLY RESULTS (patient view)
# =====================================================================

@router.get("/{visit_id}/disease-suggestions", response_model=List[DiseaseSuggestionResponse])
async def list_disease_suggestions(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """AI-suggested probable diseases for this visit."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    return await service.list_disease_suggestions(visit_id)


@router.get("/{visit_id}/prescription-draft", response_model=AIPrescriptionDraftResponse)
async def get_latest_prescription_draft(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Latest AI prescription draft (doctor will edit it before issuing)."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    draft = await service.get_latest_draft(visit_id)
    if not draft:
        raise PrescriptionNotFoundError()
    return draft


@router.get("/{visit_id}/prescription", response_model=FinalPrescriptionResponse)
async def get_final_prescription(
    visit_id: UUID,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """The final prescription issued by the doctor."""
    service = VisitService(db)
    await get_owned_visit(visit_id, current_user, db)
    prescription = await service.get_final_prescription(visit_id)
    if not prescription:
        raise PrescriptionNotFoundError()
    return prescription
