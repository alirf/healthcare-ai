"""Loader for evidence_list_clean.json.

The file is a JSON *object* keyed by evidence_id, e.g.:

    {
      "E_19_0001": {"name": "skin_lesions", "code_question": "E_19_0001", ...},
      "E_19_0002": {"name": "lesion_color", "code_question": "E_19_0001", ...},
      ...
    }

The classifier's output index maps to the lexically sorted evidence ids —
the model was trained with that ordering, so it must never change.
"""
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)


def load_evidences(path: str) -> Tuple[List[str], Dict[str, dict]]:
    """Load the evidence dictionary.

    Returns:
        eid_list: lexically sorted evidence ids (stable model class order).
        eid_info: raw evidence definitions keyed by evidence_id, passed
                  through untouched (value_meaning / possible-values /
                  default_value are metadata for the questioning step).
    Raises:
        FileNotFoundError: when the file does not exist.
        ValueError: when the file is corrupt or not a non-empty JSON object.
    """
    evidence_path = Path(path)
    if not evidence_path.is_file():
        raise FileNotFoundError(f"Evidence file not found: {evidence_path}")

    with evidence_path.open("r", encoding="utf-8") as f:
        raw = json.load(f)

    if not isinstance(raw, dict) or not raw:
        raise ValueError(f"Evidence file must be a non-empty JSON object: {evidence_path}")

    eid_info: Dict[str, dict] = {str(key): value for key, value in raw.items()}
    eid_list: List[str] = sorted(eid_info.keys())  # stable class-index order

    logger.info("Loaded %d evidence definitions from %s", len(eid_list), evidence_path)
    return eid_list, eid_info
