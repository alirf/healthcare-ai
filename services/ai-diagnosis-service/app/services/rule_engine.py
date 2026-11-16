"""Rule-based scoring engine using diseases_fixed.json.

For each disease in the registry, we compute a rule-based score based on:
  1. symptoms (weights): sum of weights for evidence_ids that match
  2. absence_symptoms: penalty for evidence_ids that SHOULD be absent but ARE present

The score is normalized to [0, 1] by dividing by the max possible weight (sum of all
symptom weights for that disease).
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from app.config import settings

logger = logging.getLogger(__name__)


class DiseaseRegistry:
    """Loads and indexes diseases_fixed.json for fast lookup."""

    def __init__(self) -> None:
        self.diseases: Dict[str, dict] = {}   # disease_id → full record
        self.loaded: bool = False
        self.load_error: Optional[str] = None

    @property
    def count(self) -> int:
        return len(self.diseases)

    def load(self) -> None:
        """Load diseases_fixed.json from disk."""
        try:
            path = Path(settings.DISEASES_PATH)
            if not path.is_file():
                raise FileNotFoundError(f"Diseases file not found: {path}")

            with path.open("r", encoding="utf-8") as f:
                raw = json.load(f)

            if not isinstance(raw, dict) or not raw:
                raise ValueError(f"Diseases file must be a non-empty JSON object: {path}")

            self.diseases = {str(k): v for k, v in raw.items()}
            self.loaded = True
            self.load_error = None
            logger.info("Loaded %d diseases from %s", len(self.diseases), path)
        except Exception as exc:
            self.loaded = False
            self.load_error = str(exc) or exc.__class__.__name__
            self.diseases = {}
            logger.error("Disease registry failed to load: %s", self.load_error, exc_info=True)

    def get_disease(self, disease_id: str) -> Optional[dict]:
        return self.diseases.get(disease_id)

    def compute_rule_score(
        self,
        disease_id: str,
        present_evidences: Set[str],
    ) -> Tuple[float, List[dict], List[dict]]:
        """Compute a rule-based score for a disease given the present evidences.

        Returns:
            (score, matched_evidences, absent_evidences)
            - score: float in [0, 1]
            - matched_evidences: list of {evidence_id, weight, class, name_fa}
            - absent_evidences: list of evidences that SHOULD be absent but ARE present
        """
        disease = self.diseases.get(disease_id)
        if not disease:
            return 0.0, [], []

        # ── 1. Positive scoring from symptoms ──
        symptoms = disease.get("symptoms", {})
        max_possible_weight = sum(s.get("weight", 0) for s in symptoms.values())
        if max_possible_weight == 0:
            return 0.0, [], []

        matched: List[dict] = []
        matched_weight = 0.0

        for eid, info in symptoms.items():
            weight = info.get("weight", 0)
            evidence_class = info.get("class", "minor")
            if eid in present_evidences:
                matched_weight += weight
                matched.append({
                    "evidence_id": eid,
                    "weight": weight,
                    "evidence_class": evidence_class,
                    "name_fa": info.get("name_fa"),
                })

        positive_score = matched_weight / max_possible_weight

        # ── 2. Penalty from absence_symptoms ──
        # If an evidence that SHOULD be absent IS present, reduce the score
        absence = disease.get("absence_symptoms", {})
        absent_violations: List[dict] = []
        penalty = 0.0

        for eid, info in absence.items():
            weight = info.get("weight", 0)
            if eid in present_evidences:
                # This evidence is present but shouldn't be → penalty
                penalty += weight * 0.5   # 50% penalty (not full, since it's a soft signal)
                absent_violations.append({
                    "evidence_id": eid,
                    "weight": weight,
                    "evidence_class": info.get("class", "minor"),
                    "name_fa": info.get("note", ""),
                })

        # Normalize penalty relative to max possible weight
        if max_possible_weight > 0:
            penalty = min(penalty / max_possible_weight, 0.5)   # cap at 50% reduction

        final_score = max(0.0, positive_score - penalty)
        return final_score, matched, absent_violations

    def get_disease_info(self, disease_id: str) -> dict:
        """Extract display info for a disease."""
        d = self.diseases.get(disease_id, {})
        return {
            "disease_id": disease_id,
            "disease_name_fa": d.get("name_fa", disease_id),
            "disease_name_en": d.get("name_en", disease_id),
            "icd10": d.get("icd10"),
            "is_emergency": d.get("is_emergency", False),
            "severity": d.get("severity", 1),
            "category": d.get("category"),
            "red_flags": d.get("red_flags", []),
            "differential": d.get("differential", []),
        }


# Module-level singleton
disease_registry = DiseaseRegistry()
