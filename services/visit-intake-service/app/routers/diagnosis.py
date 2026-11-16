"""Doctor-side diagnosis endpoints.

Mounted under the patient/doctor API surface (auth: JWT with role=doctor
or role=patient depending on endpoint).

Endpoints:

  Doctor:
    POST /visits/{visit_id}/diagnose          — trigger AI diagnosis
    GET  /visits/{visit_id}/ai-diagnosis      — fetch stored AI suggestions
    POST /visits/{visit_id}/final-diagnosis   — submit final diagnosis (ICD-10)
    GET  /visits/{visit_id}/final-diagnosis   — fetch final diagnosis (after completion)

  Patient:
    GET  /visits/{visit_id}/final-diagnosis   — view the doctor's final diagnosis

Notes:
  - The doctor's claim-visit endpoint (in app.routers.doctor) should call
    _trigger_and_store_diagnosis(visit_id, db) after assigning the visit
    so the AI suggestions are ready by the time the doctor opens the page.
    See PATCH_NOTES.md for the exact one-line hook to add.
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies.auth import require_role
from app.exceptions import (
    DiagnosisError,
    DiagnosisServiceUnavailableError,
    NotFoundError,
)
from app.models.diagnosis import AIDiagnosisSuggestion, FinalDiagnosis
from app.schemas.diagnosis import (
    AIDiagnosisResponse,
    AIDiagnosisSuggestion as AIDiagnosisSuggestionSchema,
    FinalDiagnosisRequest,
    FinalDiagnosisResponse,
)
from app.services.diagnosis_client import trigger_visit_diagnosis

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(tags=["Diagnosis"])


# =====================================================================
# Helpers
# =====================================================================

async def _trigger_and_store_diagnosis(
    visit_id: UUID,
    db: AsyncSession,
    patient_sex: str | None = None,
    patient_age: int | None = None,
    top_k: int | None = None,
    reextract: bool = False,
) -> AIDiagnosisResponse:
    """Call ai-triage-service, wipe old suggestions, store new ones.

    Used by:
      - POST /visits/{id}/diagnose          (this router)
      - The doctor's claim-visit endpoint   (imported from app.routers.doctor)

    Raises DiagnosisServiceUnavailableError if ai-triage-service is down.
    """
    if not settings.AI_DIAGNOSIS_ENABLED:
        raise DiagnosisServiceUnavailableError(
            "AI diagnosis is disabled (AI_DIAGNOSIS_ENABLED=false)"
        )

    result = await trigger_visit_diagnosis(
        visit_id=visit_id,
        patient_sex=patient_sex,
        patient_age=patient_age,
        top_k=top_k,
        reextract=reextract,
    )
    if result is None:
        raise DiagnosisServiceUnavailableError(
            "ai-triage-service is unreachable or returned an error"
        )

    # Wipe old suggestions for this visit (we always store the latest set)
    await db.execute(
        delete(AIDiagnosisSuggestion).where(
            AIDiagnosisSuggestion.visit_id == visit_id
        )
    )

    # Insert new ones (rank = 1-based position in predictions[])
    rows = []
    for idx, p in enumerate(result.predictions, start=1):
        row = AIDiagnosisSuggestion(
            visit_id=visit_id,
            disease_id=p.disease_id,
            disease_name_fa=p.disease_name_fa,
            disease_name_en=p.disease_name_en,
            icd10=p.icd10,
            ml_probability=p.ml_probability,
            rule_score=p.rule_score,
            combined_score=p.combined_score,
            is_emergency=p.is_emergency,
            severity=p.severity,
            rank=idx,
            matched_evidences=[m.model_dump() for m in p.matched_evidences],
            absent_evidences=[a.model_dump() for a in p.absent_evidences],
        )
        db.add(row)
        rows.append(row)

    await db.commit()
    await db.refresh(row for row in rows)  # ensures id/created_at are populated

    logger.info(
        "Stored %d AI diagnosis suggestions for visit %s (source=%s)",
        len(rows),
        visit_id,
        result.evidence_source,
    )

    return AIDiagnosisResponse(
        visit_id=visit_id,
        suggestions=[
            AIDiagnosisSuggestionSchema(
                id=str(row.id),
                disease_id=row.disease_id,
                disease_name_fa=row.disease_name_fa,
                disease_name_en=row.disease_name_en,
                icd10=row.icd10,
                ml_probability=row.ml_probability,
                rule_score=row.rule_score,
                combined_score=row.combined_score,
                is_emergency=row.is_emergency,
                severity=row.severity,
                matched_evidences=row.matched_evidences,
                absent_evidences=row.absent_evidences,
                rank=row.rank,
            )
            for row in rows
        ],
        evidence_source=result.evidence_source,
        patient_sex=result.patient_sex,
        model_version=result.model_version,
        rule_engine_version=result.rule_engine_version,
        diagnosed_at=datetime.now(timezone.utc),
        input_evidence_count=result.input_evidence_count,
    )


# =====================================================================
# Doctor endpoints
# =====================================================================

@router.post(
    "/visits/{visit_id}/diagnose",
    response_model=AIDiagnosisResponse,
    status_code=status.HTTP_200_OK,
)
async def trigger_diagnosis(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("doctor")),
):
    """(Re-)trigger AI diagnosis for a visit.

    Calls ai-triage-service POST /visits/{visit_id}/diagnose, then wipes
    and re-stores the suggestions for this visit. Returns the fresh set.

    Auth: JWT with role=doctor.
    """
    logger.info(
        "Doctor %s triggered AI diagnosis for visit %s",
        current_user.get("sub"),
        visit_id,
    )
    return await _trigger_and_store_diagnosis(visit_id, db)


@router.get(
    "/visits/{visit_id}/ai-diagnosis",
    response_model=AIDiagnosisResponse,
)
async def get_ai_diagnosis(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("doctor")),
):
    """Fetch the stored AI diagnosis suggestions for a visit.

    Returns 404 if no diagnosis has been triggered yet — the doctor should
    POST /visits/{id}/diagnose first.

    Auth: JWT with role=doctor.
    """
    rows = (
        await db.execute(
            select(AIDiagnosisSuggestion)
            .where(AIDiagnosisSuggestion.visit_id == visit_id)
            .order_by(AIDiagnosisSuggestion.rank)
        )
    ).scalars().all()

    if not rows:
        raise NotFoundError(
            "No AI diagnosis suggestions stored for this visit. "
            "POST /visits/{id}/diagnose to trigger one."
        )

    # Pull metadata from the first row (we don't store it separately — it
    # would be redundant with the predictions themselves).
    first = rows[0]
    return AIDiagnosisResponse(
        visit_id=visit_id,
        suggestions=[
            AIDiagnosisSuggestionSchema(
                id=str(r.id),
                disease_id=r.disease_id,
                disease_name_fa=r.disease_name_fa,
                disease_name_en=r.disease_name_en,
                icd10=r.icd10,
                ml_probability=r.ml_probability,
                rule_score=r.rule_score,
                combined_score=r.combined_score,
                is_emergency=r.is_emergency,
                severity=r.severity,
                matched_evidences=r.matched_evidences,
                absent_evidences=r.absent_evidences,
                rank=r.rank,
            )
            for r in rows
        ],
        evidence_source="stored",
        patient_sex="M",   # not stored per-row — caller knows from visit context
        model_version="stored",
        rule_engine_version="stored",
        diagnosed_at=first.created_at,
        input_evidence_count=0,
    )


@router.post(
    "/visits/{visit_id}/final-diagnosis",
    response_model=FinalDiagnosisResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_final_diagnosis(
    visit_id: UUID,
    data: FinalDiagnosisRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("doctor")),
):
    """Submit the doctor's final diagnosis for a visit.

    The doctor can either:
      - pick one of the AI suggestions (selected_suggestion_id), or
      - enter a manual diagnosis (manual_disease_name + manual_icd10).

    At least one source must be provided. The visit's status is moved to
    "completed" atomically with the diagnosis submission.

    Auth: JWT with role=doctor. Only the doctor assigned to this visit
    can submit (the doctor router enforces assignment before calling us).
    """
    # Validate that the doctor is assigned to this visit
    # (We import lazily to avoid a circular import with app.routers.doctor.)
    from app.routers.doctor import _assert_doctor_owns_visit  # type: ignore
    await _assert_doctor_owns_visit(visit_id, current_user, db)

    # Validate the request
    if not data.selected_suggestion_id and not data.manual_disease_name:
        raise DiagnosisError(
            "Either selected_suggestion_id or manual_disease_name must be provided"
        )

    # Resolve the chosen disease details
    selected_suggestion: AIDiagnosisSuggestion | None = None
    if data.selected_suggestion_id:
        selected_suggestion = (
            await db.execute(
                select(AIDiagnosisSuggestion).where(
                    AIDiagnosisSuggestion.id == UUID(data.selected_suggestion_id),
                    AIDiagnosisSuggestion.visit_id == visit_id,
                )
            )
        ).scalars().first()
        if not selected_suggestion:
            raise NotFoundError(
                f"AI suggestion {data.selected_suggestion_id} not found for visit {visit_id}"
            )

    # If both are provided, the manual entry wins (doctor override)
    if data.manual_disease_name:
        disease_name_fa = data.manual_disease_name
        disease_name_en = None
        icd10 = data.manual_icd10
        disease_id = None
        selected_suggestion_id = None
    else:
        assert selected_suggestion is not None
        disease_name_fa = selected_suggestion.disease_name_fa
        disease_name_en = selected_suggestion.disease_name_en
        icd10 = selected_suggestion.icd10
        disease_id = selected_suggestion.disease_id
        selected_suggestion_id = selected_suggestion.id

    # Idempotency: if there's already a final diagnosis for this visit,
    # update it instead of erroring out (so the doctor can revise).
    existing = (
        await db.execute(
            select(FinalDiagnosis).where(FinalDiagnosis.visit_id == visit_id)
        )
    ).scalars().first()

    is_update = existing is not None
    if existing:
        existing.disease_name_fa = disease_name_fa
        existing.disease_name_en = disease_name_en
        existing.icd10 = icd10
        existing.disease_id = disease_id
        existing.selected_suggestion_id = selected_suggestion_id
        existing.notes = data.notes
        existing.requires_follow_up = data.requires_follow_up
        existing.follow_up_days = data.follow_up_days
        existing.doctor_id = UUID(str(current_user["sub"]))
        existing.created_at = datetime.now(timezone.utc)
        row = existing
    else:
        row = FinalDiagnosis(
            visit_id=visit_id,
            doctor_id=UUID(str(current_user["sub"])),
            disease_name_fa=disease_name_fa,
            disease_name_en=disease_name_en,
            icd10=icd10,
            disease_id=disease_id,
            selected_suggestion_id=selected_suggestion_id,
            notes=data.notes,
            requires_follow_up=data.requires_follow_up,
            follow_up_days=data.follow_up_days,
        )
        db.add(row)

    # Move the visit status to "completed". If your project has a Visit ORM
    # model, replace this raw SQL with a proper ORM update.
    await db.execute(
        text("UPDATE visits SET status = 'completed', completed_at = NOW() WHERE id = :vid"),
        {"vid": visit_id},
    )

    await db.commit()
    await db.refresh(row)

    logger.info(
        "Final diagnosis submitted for visit %s by doctor %s: disease=%s icd10=%s",
        visit_id,
        current_user.get("sub"),
        disease_name_fa,
        icd10,
    )

    # Override the response status code: 201 for new, 200 for update.
    if is_update:
        response.status_code = status.HTTP_200_OK

    return FinalDiagnosisResponse(
        id=str(row.id),
        visit_id=row.visit_id,
        disease_name_fa=row.disease_name_fa,
        disease_name_en=row.disease_name_en,
        icd10=row.icd10,
        disease_id=row.disease_id,
        selected_suggestion_id=str(row.selected_suggestion_id) if row.selected_suggestion_id else None,
        notes=row.notes,
        requires_follow_up=row.requires_follow_up,
        follow_up_days=row.follow_up_days,
        doctor_id=str(row.doctor_id),
        created_at=row.created_at,
        visit_status="completed",
    )


# =====================================================================
# Patient + Doctor shared endpoint
# =====================================================================

@router.get(
    "/visits/{visit_id}/final-diagnosis",
    response_model=FinalDiagnosisResponse,
)
async def get_final_diagnosis(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("doctor", "patient")),
):
    """Fetch the final diagnosis for a visit.

    Doctor: can view any time after submission.
    Patient: can view only after the visit status is "completed" (the
    submit endpoint moves it there atomically).

    Auth: JWT with role=doctor OR role=patient.
    """
    row = (
        await db.execute(
            select(FinalDiagnosis).where(FinalDiagnosis.visit_id == visit_id)
        )
    ).scalars().first()

    if not row:
        raise NotFoundError("No final diagnosis submitted for this visit yet")

    # Patients only see it once the visit is completed
    visit_status = (
        await db.execute(text("SELECT status FROM visits WHERE id = :vid"), {"vid": visit_id})
    ).scalar_one_or_none() or "unknown"
    if current_user.get("role") == "patient":
        if visit_status != "completed":
            raise NotFoundError(
                "Final diagnosis is not yet available — visit is still in progress"
            )

    # Reuse the visit_status we just queried

    return FinalDiagnosisResponse(
        id=str(row.id),
        visit_id=row.visit_id,
        disease_name_fa=row.disease_name_fa,
        disease_name_en=row.disease_name_en,
        icd10=row.icd10,
        disease_id=row.disease_id,
        selected_suggestion_id=str(row.selected_suggestion_id) if row.selected_suggestion_id else None,
        notes=row.notes,
        requires_follow_up=row.requires_follow_up,
        follow_up_days=row.follow_up_days,
        doctor_id=str(row.doctor_id),
        created_at=row.created_at,
        visit_status=visit_status,
    )
