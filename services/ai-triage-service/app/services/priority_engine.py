"""Triage priority engine — maps detected evidences to a clinical priority.

This is a deliberately simple, transparent, rule-based engine. It is NOT a
diagnostic model: it only flags patterns that warrant a higher queue
priority so the doctor can see them sooner. Real diagnostic reasoning stays
with the doctor.

Red-flag evidence IDs are grouped by severity tier. If ANY red-flag from a
higher tier is detected, the priority is bumped to that tier.
"""
import logging
from typing import List, Set

from app.schemas.nlp import DetectedEvidence
from app.schemas.triage import TriagePriority

logger = logging.getLogger(__name__)

# ── Red-flag evidence registry ─────────────────────────────────────────
# These IDs come from evidence_list_clean.json (the 911-evidence registry).
# Only the most unambiguous "drop everything" symptoms are flagged
# EMERGENCY; HIGH covers serious-but-not-immediately-lethal patterns.

EMERGENCY_RED_FLAGS: Set[str] = {
    # cardiac / respiratory collapse
    "E_07_0033",   # shock
    "E_00_0009",   # loss of consciousness
    "E_06_0003",   # dyspnea (severe shortness of breath)
    "E_06_0011",   # stridor
    "E_06_0006",   # laryngospasm episode
    "E_00_0013",   # dizziness / faint
    # neurologic emergency
    "E_17_0002",   # seizure / absence
    "E_17_0017",   # stroke history (active event implied)
    "E_17_0043",   # skull defect
    # bleeding
    "E_09_0001",   # hematemesis (vomiting blood)
    "E_09_0002",   # melena (black stools)
    "E_06_0010",   # hemoptysis (coughing blood)
    "E_10_0002",   # hematochezia (rectal bleeding)
    # anaphylaxis
    "E_22_0013",   # angioedema
    "E_22_0007",   # allergic reaction
}

HIGH_RED_FLAGS: Set[str] = {
    # cardiac
    "E_07_0001",   # palpitations
    "E_07_0006",   # chest pain at rest
    "E_07_0002",   # exertional symptoms
    "E_06_0002",   # pleuritic pain
    "E_06_0005",   # dyspnea minimal effort
    # neurologic
    "E_17_0003",   # facial paralysis
    "E_17_0006",   # limb weakness
    "E_17_0009",   # paresthesia mouth + limbs
    "E_17_0010",   # prior paralysis
    "E_17_0005",   # confusion
    # severe systemic
    "E_00_0017",   # severe fatigue (bed-bound)
    "E_00_0059",   # refractory to antipyretics
    "E_21_0003",   # sleep interference (high score)
    # obstetric
    "E_29_0011",   # bleeding during pregnancy
    "E_29_0006",   # threatened miscarriage
    # suicidal / self-harm
    "E_20_0057",   # suicidal ideation
    "E_20_0046",   # self harm
}


def compute_priority(
    detected: List[DetectedEvidence],
) -> tuple[TriagePriority, List[str]]:
    """Return (priority, red_flag_evidence_ids) for the given detections.

    Rules (top-down, first match wins):
      1. ANY emergency red flag detected  → EMERGENCY
      2. ANY high red flag detected       → HIGH
      3. >= 3 evidences above 0.7 conf    → HIGH  (multi-system involvement)
      4. >= 1 evidence above 0.7 conf     → NORMAL
      5. otherwise                        → LOW
    """
    detected_ids = {e.evidence_id for e in detected}

    emergency_hits = [eid for eid in EMERGENCY_RED_FLAGS if eid in detected_ids]
    if emergency_hits:
        logger.info(
            "Triage priority EMERGENCY — red flags: %s", ", ".join(emergency_hits)
        )
        return TriagePriority.EMERGENCY, emergency_hits

    high_hits = [eid for eid in HIGH_RED_FLAGS if eid in detected_ids]
    if high_hits:
        logger.info("Triage priority HIGH — red flags: %s", ", ".join(high_hits))
        return TriagePriority.HIGH, high_hits

    high_confidence = [e for e in detected if e.confidence >= 0.7]
    if len(high_confidence) >= 3:
        logger.info(
            "Triage priority HIGH — %d evidences above 0.7 confidence",
            len(high_confidence),
        )
        # not red-flag IDs, but report them so the caller can highlight them
        return TriagePriority.HIGH, [e.evidence_id for e in high_confidence]

    if high_confidence:
        logger.info("Triage priority NORMAL — 1-2 high-confidence evidences")
        return TriagePriority.NORMAL, []

    logger.info("Triage priority LOW — no high-confidence evidences")
    return TriagePriority.LOW, []
