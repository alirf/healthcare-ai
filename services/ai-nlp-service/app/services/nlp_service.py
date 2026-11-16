"""Stateless inference wrapper around the ParsBERT evidence classifier.

The model is loaded exactly once (lifespan startup) and shared by every
request. Torch inference never runs on the event loop — it is dispatched
to Starlette's thread pool via run_in_threadpool. There is deliberately
no ProcessPoolExecutor: the model is an in-process singleton.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
from starlette.concurrency import run_in_threadpool
from transformers import BertTokenizer

from app.config import settings
from app.exceptions import ModelNotLoadedError
from app.schemas.nlp import DetectedEvidence
from app.services.classifier import EvidenceClassifier
from app.services.evidence_loader import load_evidences

logger = logging.getLogger(__name__)


def postprocess_probabilities(
    probs: np.ndarray,
    eid_list: List[str],
    eid_info: Dict[str, dict],
    threshold: float,
    top_k: Optional[int],
    apply_hierarchy_filter: bool,
) -> List[DetectedEvidence]:
    """Shared multi-label post-processing (also reused by the test fake).

    1. keep evidences with probability strictly greater than `threshold`,
    2. sort by confidence descending,
    3. optional hierarchy filter: a child evidence (code_question pointing at
       another evidence) is only kept when its parent is also detected —
       root evidences (code_question == own id) are always kept,
    4. optional top-k cut, applied after the filter.
    """
    if len(probs) != len(eid_list):
        raise ValueError(
            f"Probability vector length {len(probs)} != evidence count {len(eid_list)}"
        )

    scored: List[Tuple[str, float]] = [
        (eid, float(probs[idx])) for idx, eid in enumerate(eid_list)
    ]
    detected = [(eid, prob) for eid, prob in scored if prob > threshold]
    detected.sort(key=lambda item: item[1], reverse=True)

    detected_ids = {eid for eid, _ in detected}

    results: List[DetectedEvidence] = []
    dropped: List[str] = []
    for eid, prob in detected:
        info = eid_info.get(eid, {})
        parent = info.get("code_question") or eid  # missing -> treat as root
        if apply_hierarchy_filter and parent != eid and parent not in detected_ids:
            dropped.append(eid)
            continue
        results.append(_build_detected_evidence(eid, prob, info))

    if dropped:
        logger.warning(
            "Hierarchy filter dropped %d child evidence(s) with no detected parent: %s",
            len(dropped),
            ", ".join(dropped),
        )

    if top_k is not None:
        results = results[:top_k]

    return results


def _build_detected_evidence(eid: str, prob: float, info: Dict[str, Any]) -> DetectedEvidence:
    """Map a raw evidence definition to the response schema (pass-through)."""
    return DetectedEvidence(
        evidence_id=eid,
        name=info.get("name", eid),
        name_fa=info.get("name_fa"),
        question_en=info.get("question_en"),
        question_fa=info.get("question_fa"),
        data_type=info.get("data_type"),
        is_antecedent=info.get("is_antecedent"),
        code_question=info.get("code_question"),
        default_value=info.get("default_value"),
        value_meaning=info.get("value_meaning"),
        possible_values=info.get("possible-values"),
        confidence=round(prob, 4),
    )


class NLPService:
    """Singleton wrapper around the trained EvidenceClassifier."""

    def __init__(self) -> None:
        self.model: Optional[EvidenceClassifier] = None
        self.tokenizer: Optional[BertTokenizer] = None
        self.eid_list: List[str] = []
        self.eid_info: Dict[str, dict] = {}
        self.device: str = "cpu"
        self.loaded_at: Optional[str] = None
        self.loaded: bool = False
        self.load_error: Optional[str] = None
        self.training_metadata: Dict[str, Any] = {}

    @property
    def evidence_count(self) -> int:
        return len(self.eid_list)

    def load(self) -> None:
        """Load evidences, tokenizer and checkpoint. Never raises.

        Any failure leaves the service alive in a degraded state:
        /health reports 503 and /extract + /model-info raise
        ModelNotLoadedError (503).
        """
        started = time.perf_counter()
        try:
            # Env override DEVICE takes priority; otherwise auto-detect.
            if settings.DEVICE:
                device = settings.DEVICE
            else:
                device = "cuda" if torch.cuda.is_available() else "cpu"
            self.device = str(device)
            logger.info("Using device: %s", self.device)

            self.eid_list, self.eid_info = load_evidences(settings.EVIDENCE_PATH)

            logger.info("Loading tokenizer: %s", settings.MODEL_NAME)
            self.tokenizer = BertTokenizer.from_pretrained(settings.MODEL_NAME)

            logger.info("Loading checkpoint: %s", settings.MODEL_PATH)
            checkpoint = torch.load(
                settings.MODEL_PATH,
                map_location=self.device,
                weights_only=False,  # required for PyTorch 2.6+
            )
            if not isinstance(checkpoint, dict) or "model_state_dict" not in checkpoint:
                raise ValueError("Checkpoint must be a dict containing 'model_state_dict'")

            state_dict = checkpoint["model_state_dict"]
            n_classes = int(state_dict["classifier.weight"].shape[0])
            if n_classes != len(self.eid_list):
                # The most common deployment bug: checkpoint trained against a
                # different evidence list. Stay alive, report unhealthy.
                logger.error(
                    "Class-count mismatch: checkpoint has %d output classes but "
                    "evidence list has %d entries — refusing to load",
                    n_classes,
                    len(self.eid_list),
                )
                raise ValueError(
                    f"Checkpoint class count ({n_classes}) != evidence count ({len(self.eid_list)})"
                )

            model = EvidenceClassifier(n_classes=n_classes, model_name=settings.MODEL_NAME)
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()  # inference only — disable dropout for determinism
            self.model = model

            self.training_metadata = {
                "f1": self._as_float(checkpoint.get("f1"), "f1"),
                "epoch": self._as_int(checkpoint.get("epoch"), "epoch"),
            }

            self.loaded_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            self.loaded = True
            self.load_error = None
            logger.info(
                "Model '%s' loaded on %s in %.1f ms (%d evidences, training_f1=%s, training_epoch=%s)",
                settings.MODEL_VERSION,
                self.device,
                (time.perf_counter() - started) * 1000,
                len(self.eid_list),
                self.training_metadata["f1"],
                self.training_metadata["epoch"],
            )
        except Exception as exc:
            self.loaded = False
            self.load_error = str(exc) or exc.__class__.__name__
            self.model = None
            self.tokenizer = None
            logger.error("Model failed to load: %s", self.load_error, exc_info=True)

    def unload(self) -> None:
        """Release model resources on shutdown."""
        self.loaded = False
        self.model = None
        self.tokenizer = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("Model resources released")

    async def extract(
        self,
        text: str,
        threshold: float,
        top_k: Optional[int] = None,
        apply_hierarchy_filter: bool = True,
    ) -> Tuple[List[DetectedEvidence], float]:
        """Run inference in the thread pool; returns (detected, elapsed_ms)."""
        return await run_in_threadpool(
            self._infer_sync, text, threshold, top_k, apply_hierarchy_filter
        )

    def _infer_sync(
        self,
        text: str,
        threshold: float,
        top_k: Optional[int],
        apply_hierarchy_filter: bool,
    ) -> Tuple[List[DetectedEvidence], float]:
        if not self.loaded or self.model is None or self.tokenizer is None:
            raise ModelNotLoadedError()

        started = time.perf_counter()

        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=settings.MAX_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        with torch.no_grad():
            outputs = self.model(
                encoding["input_ids"].to(self.device),
                encoding["attention_mask"].to(self.device),
            )
            probs = torch.sigmoid(outputs).cpu().numpy()[0]  # multi-label

        detected = postprocess_probabilities(
            probs=probs,
            eid_list=self.eid_list,
            eid_info=self.eid_info,
            threshold=threshold,
            top_k=top_k,
            apply_hierarchy_filter=apply_hierarchy_filter,
        )

        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "Inference finished in %.1f ms: %d evidence(s) above threshold %.2f",
            elapsed_ms,
            len(detected),
            threshold,
        )
        return detected, elapsed_ms

    @staticmethod
    def _as_float(value: Any, label: str) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            logger.warning("Could not coerce checkpoint %s=%r to float", label, value)
            return None

    @staticmethod
    def _as_int(value: Any, label: str) -> Optional[int]:
        if value is None:
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            logger.warning("Could not coerce checkpoint %s=%r to int", label, value)
            return None


# Module-level singleton — import this, never instantiate elsewhere.
nlp_service = NLPService()
