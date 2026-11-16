"""Preview endpoint for direct evidence extraction without a visit.

This router exposes POST /extract-evidences-preview so the frontend chat
can hit the ParsBERT model on free text BEFORE a visit is created. The
visit-id-based endpoint POST /visits/{visit_id}/extract-evidences stays
available for the regular visit-intake flow.

Auth: requires an authenticated patient (the same role that owns the chat).
No persistence happens here — the evidences are returned to the caller only.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_role
from app.exceptions import NLPServiceUnavailableError
from app.schemas.nlp import ExtractPreviewRequest, EvidenceExtractionResponse
from app.services.nlp_client import extract_evidences

router = APIRouter(tags=["Preview"])


@router.post("/extract-evidences-preview", response_model=EvidenceExtractionResponse)
async def extract_evidences_preview(
    data: ExtractPreviewRequest,
    current_user: dict = Depends(require_role("patient")),
    db: AsyncSession = Depends(get_db),
):
    """Preview evidence extraction from free text without creating a visit.

    Calls ai-nlp-service POST /extract with the patient's raw text and
    returns the detected evidences. Nothing is stored in visits_db.
    """
    result = await extract_evidences(data.text)
    if result is None:
        # ai-nlp-service disabled / unreachable / non-200 — surface a 502
        # so the frontend can show an explicit error instead of a silent
        # fallback to fake symptoms.
        raise NLPServiceUnavailableError()

    return EvidenceExtractionResponse(
        visit_id=None,                # preview has no visit
        text_chars=len(data.text),
        detected=result.detected,
        stored_count=0,               # nothing persisted
        duplicate_count=0,
        model_version=result.model_version,
        inference_time_ms=result.inference_time_ms,
    )
