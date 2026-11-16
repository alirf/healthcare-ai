"""Diagnosis endpoint — the core of ai-diagnosis-service.

POST /diagnose
  Input:  {evidence_ids: [...], patient_sex: "M"|"F", patient_age?: int, top_k?: int}
  Output: {predictions: [{disease_id, disease_name_fa, icd10, ml_probability,
                          rule_score, combined_score, matched_evidences, ...}], ...}

The service combines two scoring systems:
  1. ML model (LogisticRegression) — gives ml_probability for each of 457 diseases
  2. Rule engine (diseases_fixed.json) — gives rule_score based on symptom weight matching

Final combined_score = ML_WEIGHT * ml_probability + RULE_WEIGHT * rule_score
"""
import logging
import time
from typing import List

import numpy as np
from fastapi import APIRouter, Depends

from app.config import settings
from app.dependencies.auth import verify_internal_api_key
from app.exceptions import DiagnosisError, ModelNotLoadedError
from app.schemas.diagnosis import (
    DiagnosisRequest,
    DiagnosisResponse,
    DiseasePrediction,
    MatchedEvidence,
)
from app.services.model_service import diagnosis_model
from app.services.rule_engine import disease_registry

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Diagnosis"], dependencies=[Depends(verify_internal_api_key)])


@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(data: DiagnosisRequest) -> DiagnosisResponse:
    """Predict probable diseases from a list of evidence IDs.

    Called by ai-triage-service (or visit-intake-service) when the doctor
    claims a visit. The evidence_ids come from ParsBERT's extraction on the
    patient's free text.

    Auth: requires X-Internal-API-Key header.
    """
    if not diagnosis_model.loaded:
        raise ModelNotLoadedError(
            f"Diagnosis model is not loaded: {diagnosis_model.load_error}"
        )
    if not disease_registry.loaded:
        raise ModelNotLoadedError(
            f"Disease registry is not loaded: {disease_registry.load_error}"
        )

    if not data.evidence_ids:
        raise DiagnosisError("At least one evidence_id is required")

    started = time.perf_counter()
    patient_sex = (data.patient_sex or "M").upper()
    present_set = set(data.evidence_ids)

    logger.info(
        "Diagnosis request: %d evidences, sex=%s, age=%s, top_k=%d",
        len(data.evidence_ids),
        patient_sex,
        data.patient_age,
        data.top_k,
    )

    # ── 1. ML model prediction ──
    probabilities, ml_time_ms = diagnosis_model.predict(
        evidence_ids=data.evidence_ids,
        patient_sex=patient_sex,
    )

    # ── 2. Rule-based scoring + combination ──
    predictions: List[DiseasePrediction] = []

    for i, disease_id in enumerate(diagnosis_model.classes):
        ml_prob = float(probabilities[i])

        # Skip diseases with very low ML probability (perf optimization)
        if ml_prob < settings.MIN_PROBABILITY:
            continue

        # Rule-based score
        rule_score, matched, absent = disease_registry.compute_rule_score(
            disease_id=disease_id,
            present_evidences=present_set,
        )

        # Combined score
        combined = (
            settings.ML_WEIGHT * ml_prob
            + settings.RULE_WEIGHT * rule_score
        )

        # Skip if combined score is also very low
        if combined < settings.MIN_PROBABILITY:
            continue

        info = disease_registry.get_disease_info(disease_id)

        matched_evs = [
            MatchedEvidence(
                evidence_id=m["evidence_id"],
                weight=m["weight"],
                evidence_class=m["evidence_class"],
                name_fa=m.get("name_fa"),
            )
            for m in matched[:10]  # cap at 10 matched evidences for response size
        ]
        absent_evs = [
            MatchedEvidence(
                evidence_id=a["evidence_id"],
                weight=a["weight"],
                evidence_class=a["evidence_class"],
                name_fa=a.get("name_fa"),
            )
            for a in absent[:5]
        ]

        predictions.append(DiseasePrediction(
            disease_id=disease_id,
            disease_name_fa=info["disease_name_fa"],
            disease_name_en=info["disease_name_en"],
            icd10=info["icd10"],
            ml_probability=round(ml_prob, 4),
            rule_score=round(rule_score, 4),
            combined_score=round(combined, 4),
            is_emergency=info["is_emergency"],
            severity=info["severity"],
            matched_evidences=matched_evs,
            absent_evidences=absent_evs,
        ))

    # ── 3. Sort by combined score and take top_k ──
    predictions.sort(key=lambda p: p.combined_score, reverse=True)
    predictions = predictions[:data.top_k]

    total_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "Diagnosis complete: %d predictions (from %d classes), %.1f ms total (ML: %.1f ms)",
        len(predictions),
        len(diagnosis_model.classes),
        total_ms,
        ml_time_ms,
    )

    return DiagnosisResponse(
        predictions=predictions,
        input_evidence_count=len(data.evidence_ids),
        patient_sex=patient_sex,
        model_version="logistic-regression-v1",
        inference_time_ms=round(total_ms, 1),
        rule_engine_version="rule-based-v1",
    )
