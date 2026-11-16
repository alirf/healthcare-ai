"""Async client for visit-intake-service internal endpoints.

Used by the orchestration flows:
  - POST /visits/{visit_id}/triage     → fetch context, push AI symptoms
  - POST /visits/{visit_id}/diagnose   → fetch context, resolve evidences + sex

Endpoints called:
  - GET  /internal/intake/visits/{visit_id}/context  (patient messages + symptoms + visit)
  - POST /internal/intake/visits/{visit_id}/symptoms/ai  (push AI symptoms)

All calls use the shared X-Internal-API-Key.
"""
import json
import logging
import re
from typing import Any, List, Optional, Tuple
from uuid import UUID

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def _internal_headers() -> dict:
    h = {}
    if settings.INTERNAL_API_KEY:
        h["X-Internal-API-Key"] = settings.INTERNAL_API_KEY
    return h


async def fetch_visit_context(visit_id: UUID) -> Optional[dict[str, Any]]:
    """GET /internal/intake/visits/{visit_id}/context → full visit payload."""
    if not settings.VISIT_INTAKE_SERVICE_URL:
        logger.error("VISIT_INTAKE_SERVICE_URL is not configured")
        return None

    url = (
        f"{settings.VISIT_INTAKE_SERVICE_URL.rstrip('/')}"
        f"/internal/intake/visits/{visit_id}/context"
    )
    try:
        async with httpx.AsyncClient(timeout=settings.VISIT_INTAKE_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("visit-intake context fetch failed (%s): %s", url, exc)
        return None

    if resp.status_code != 200:
        logger.warning(
            "visit-intake context fetch returned HTTP %s: %s",
            resp.status_code,
            resp.text[:300],
        )
        return None

    try:
        return resp.json()
    except ValueError:
        return None


async def push_ai_symptoms(visit_id: UUID, symptoms: List[dict], model_version: str) -> int:
    """POST /internal/intake/visits/{visit_id}/symptoms/ai → store AI symptoms.

    Returns the number of symptoms actually stored (duplicates are skipped
    server-side). Returns 0 on any failure.
    """
    if not settings.VISIT_INTAKE_SERVICE_URL:
        return 0

    url = (
        f"{settings.VISIT_INTAKE_SERVICE_URL.rstrip('/')}"
        f"/internal/intake/visits/{visit_id}/symptoms/ai"
    )
    payload = {"symptoms": symptoms, "model_version": model_version}

    try:
        async with httpx.AsyncClient(timeout=settings.VISIT_INTAKE_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=_internal_headers())
    except httpx.HTTPError as exc:
        logger.warning("visit-intake symptoms push failed (%s): %s", url, exc)
        return 0

    if resp.status_code != 201:
        logger.warning(
            "visit-intake symptoms push returned HTTP %s: %s",
            resp.status_code,
            resp.text[:300],
        )
        return 0

    try:
        stored = resp.json()
        return len(stored) if isinstance(stored, list) else 0
    except ValueError:
        return 0


def collect_patient_text(visit_context: dict) -> str:
    """Aggregate the patient's Persian intake messages in chronological order.

    Mirrors the logic in visit-intake-service's collect_visit_text() so the
    orchestrator and the caller would produce the same text for the same
    visit. Only sender_type == "patient" text messages are included.
    """
    messages = visit_context.get("messages", []) or []
    parts = [
        (m.get("content") or "").strip()
        for m in sorted(messages, key=lambda m: m.get("sequence", 0))
        if m.get("sender_type") == "patient" and (m.get("content") or "").strip()
    ]
    return "\n".join(parts)


# ──────────────────────────────────────────────────────────────────────
# NEW — diagnosis-related helpers
# ──────────────────────────────────────────────────────────────────────

# Matches evidence IDs like "E_00_0001", "E_06_0004" anywhere in a string.
_EVIDENCE_ID_RE = re.compile(r"E_\d{2}_\d{4}")


def collect_stored_evidence_ids(visit_context: dict) -> List[str]:
    """Pull evidence_ids out of the AI symptoms stored on the visit.

    visit-intake-service stores AI symptoms with notes = JSON like:
        {"evidence_id": "E_00_0001", "code_question": "...", ...}
    This helper parses those notes and returns the unique, ordered list
    of evidence_ids. Returns [] if there are no AI symptoms or none of
    them carry an evidence_id (e.g. older records).
    """
    symptoms = visit_context.get("symptoms", []) or []
    seen: set[str] = set()
    ordered: List[str] = []

    for s in symptoms:
        if s.get("source") != "ai":
            continue
        notes = s.get("notes") or ""
        evidence_id: Optional[str] = None

        # Try JSON first (canonical format pushed by triage.py)
        if notes.startswith("{"):
            try:
                trace = json.loads(notes)
                evidence_id = trace.get("evidence_id")
            except ValueError:
                pass

        # Fallback: regex-scan the whole notes string
        if not evidence_id:
            m = _EVIDENCE_ID_RE.search(notes)
            if m:
                evidence_id = m.group(0)

        if evidence_id and evidence_id not in seen:
            seen.add(evidence_id)
            ordered.append(evidence_id)

    return ordered


def resolve_patient_sex(visit_context: dict) -> str:
    """Best-effort resolution of patient sex from visit context.

    Order of preference:
      1. visit.patient_sex            (M/F) — set by medical-record-service
      2. visit.patient.gender         (male/female) — fallback
      3. visit.patient_sex_at_birth   (M/F) — alternative field name
      4. "M"                          — conservative default for the ML model
    """
    visit = visit_context.get("visit", {}) or visit_context  # tolerate both shapes
    patient = visit_context.get("patient", {}) or {}

    candidates = (
        visit.get("patient_sex"),
        visit.get("patient_sex_at_birth"),
        patient.get("sex"),
        patient.get("gender"),
    )
    for raw in candidates:
        if not raw:
            continue
        s = str(raw).strip().upper()
        if s in ("M", "MALE"):
            return "M"
        if s in ("F", "FEMALE"):
            return "F"
    return "M"


def resolve_patient_age(visit_context: dict) -> Optional[int]:
    """Best-effort resolution of patient age in years (for rule engine)."""
    visit = visit_context.get("visit", {}) or visit_context
    patient = visit_context.get("patient", {}) or {}
    for raw in (visit.get("patient_age"), patient.get("age"), patient.get("patient_age")):
        if raw is None:
            continue
        try:
            return int(raw)
        except (TypeError, ValueError):
            continue
    return None
