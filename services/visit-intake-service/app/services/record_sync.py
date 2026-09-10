"""Sync hooks between visit-intake-service and medical-record-service.

When a visit is created with (or linked to) a medical_record_id, we register
the visit in the record's junction table via an internal call. Failures are
logged but never block the visit operation (eventual consistency).
"""
import logging
from uuid import UUID

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


async def sync_visit_to_record(
    medical_record_id: UUID,
    visit_id: UUID,
    patient_id: UUID,
    added_by: UUID | None = None,
) -> bool:
    """Register a visit on a medical record (POST /internal/records/{id}/visits).

    Returns True on success. Any failure (network, 4xx/5xx) is logged and
    swallowed so the visit flow is never broken by the sync.
    """
    settings = get_settings()
    if not settings.MEDICAL_RECORD_SERVICE_URL:
        logger.warning("MEDICAL_RECORD_SERVICE_URL not set; skipping record sync")
        return False

    payload = {"visit_id": str(visit_id), "patient_id": str(patient_id)}
    if added_by:
        payload["added_by"] = str(added_by)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.MEDICAL_RECORD_SERVICE_URL}"
                f"/internal/records/{medical_record_id}/visits",
                headers={"X-Internal-API-Key": settings.INTERNAL_API_KEY},
                json=payload,
            )
            if resp.status_code == 201:
                return True
            # 409 duplicate link is fine — already registered
            if resp.status_code == 409:
                return True
            logger.warning(
                "record sync failed: status=%s body=%s",
                resp.status_code, resp.text,
            )
            return False
    except httpx.HTTPError as e:
        logger.warning("record sync error: %s", e)
        return False
