"""Glue between visit intake and ai-nlp-service.

collect_visit_text()       -> aggregates the patient's Persian intake text
run_extraction_for_visit() -> text -> POST /extract -> AI symptom rows

The results are stored through the existing bulk_add_ai_symptoms() flow, so
the whole platform keeps consuming VisitSymptom rows exactly as before.
"""
import json
import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.exceptions import NLPServiceUnavailableError
from app.schemas.clinical import AISymptomInput, AISymptomsBulkInput
from app.schemas.nlp import DetectedEvidence, EvidenceExtractionResponse
from app.services.nlp_client import extract_evidences
from app.services.visit_service import VisitService

logger = logging.getLogger(__name__)

MAX_SYMPTOM_NAME = 150     # VisitSymptom.symptom_name column width
NOTES_MAX_CHARS = 4000     # hard cap for the traceability JSON stored in notes


def collect_visit_text(messages) -> str:
    """Aggregate the patient's Persian intake text in chronological order.

    Text messages contribute their content; file messages contribute only
    their caption (attachment bytes are not OCR'd here). Non-patient messages
    (ai / system follow-ups) are excluded — the model must only see the
    patient's own words.
    """
    parts = [
        (m.content or "").strip()
        for m in sorted(messages, key=lambda m: m.sequence)
        if m.sender_type == "patient" and (m.content or "").strip()
    ]
    return "\n".join(parts)


def _evidence_to_symptom(evidence: DetectedEvidence) -> AISymptomInput:
    """Map one detected evidence to an AI symptom row.

    symptom_name prefers the Persian display name (falls back to the English
    name, then the raw evidence_id) so the doctor UI stays readable; the
    canonical evidence_id plus the full metadata travel in `notes` as JSON.
    """
    display_name = (evidence.name_fa or evidence.name or evidence.evidence_id)
    display_name = display_name.strip()[:MAX_SYMPTOM_NAME]

    trace = {"evidence_id": evidence.evidence_id}
    if evidence.code_question:
        trace["code_question"] = evidence.code_question
    if evidence.question_fa:
        trace["question_fa"] = evidence.question_fa
    if evidence.question_en:
        trace["question_en"] = evidence.question_en
    if evidence.data_type:
        trace["data_type"] = evidence.data_type
    notes = json.dumps(trace, ensure_ascii=False, sort_keys=True)[:NOTES_MAX_CHARS]

    return AISymptomInput(
        symptom_name=display_name,
        confidence=max(0.0, min(1.0, evidence.confidence)),
        notes=notes,
    )


async def run_extraction_for_visit(
    visit_id: UUID,
    db: AsyncSession,
    *,
    fail_safe: bool = True,
) -> Optional[EvidenceExtractionResponse]:
    """Run evidence extraction for a visit and store the results as AI symptoms.

    fail_safe=True  -> any failure is logged and None is returned. Used inside
                       POST /visits/{id}/submit: an unavailable NLP service
                       must never block the submission.
    fail_safe=False -> raises NLPServiceUnavailableError on failure. Used by
                       POST /visits/{id}/extract-evidences, where the caller
                       explicitly asked for the extraction and wants feedback.
    """
    settings = get_settings()

    if not settings.AI_NLP_ENABLED:
        logger.info("AI NLP integration disabled — skipping extraction for visit %s", visit_id)
        if fail_safe:
            return None
        raise NLPServiceUnavailableError(
            "AI NLP integration is disabled (AI_NLP_ENABLED=false)"
        )

    service = VisitService(db)
    messages = await service.list_messages(visit_id)
    text = collect_visit_text(messages)

    if not text:
        logger.info("Visit %s has no patient text to analyse", visit_id)
        return EvidenceExtractionResponse(
            visit_id=visit_id,
            text_chars=0,
            detected=[],
            stored_count=0,
            duplicate_count=0,
        )

    if len(text) > settings.AI_NLP_TEXT_MAX_CHARS:
        logger.info(
            "Visit %s text truncated from %d to %d chars before sending",
            visit_id, len(text), settings.AI_NLP_TEXT_MAX_CHARS,
        )
        text = text[: settings.AI_NLP_TEXT_MAX_CHARS]

    result = await extract_evidences(text)
    if result is None:
        if fail_safe:
            logger.warning(
                "Evidence extraction failed for visit %s — continuing without AI symptoms",
                visit_id,
            )
            return None
        raise NLPServiceUnavailableError()

    symptoms = [_evidence_to_symptom(e) for e in result.detected]
    stored = await service.bulk_add_ai_symptoms(
        visit_id,
        AISymptomsBulkInput(
            symptoms=symptoms,
            model_version=(result.model_version or "")[:50] or None,
        ),
    )

    outcome = EvidenceExtractionResponse(
        visit_id=visit_id,
        text_chars=len(text),
        detected=result.detected,
        stored_count=len(stored),
        duplicate_count=len(result.detected) - len(stored),
        model_version=result.model_version,
        inference_time_ms=result.inference_time_ms,
    )
    logger.info(
        "Extraction for visit %s: %d detected, %d stored, %d duplicate(s)",
        visit_id, len(result.detected), len(stored), outcome.duplicate_count,
    )
    return outcome
