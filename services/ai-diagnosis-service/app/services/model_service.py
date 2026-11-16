"""ML model loader and predictor — wraps the LogisticRegression + DictVectorizer bundle.

The PKL file is a dict with three keys:
  - 'model':      LogisticRegression (457 classes, 1243 features)
  - 'vectorizer': DictVectorizer (1242 evidence features)
  - 'classes':    ndarray of disease IDs (457)

The 1243rd feature (not in the vectorizer) is SEX:
  - 1 = Male
  - 0 = Female

Evidence features in the vectorizer follow this pattern:
  - Boolean evidences (data_type B): just the evidence_id, e.g. "E_00_0001"
  - Multi-value evidences (data_type M/C): "E_XX_XXXX_@_V_YYY", one per possible value
    e.g. "E_00_0002_@_V_100" means pain_location = forehead

For v1, we only set boolean features (since ParsBERT gives us boolean present/absent).
Multi-value features require the patient's specific answer, which isn't available yet.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
from scipy import sparse

from app.config import settings

logger = logging.getLogger(__name__)


class DiagnosisModel:
    """Singleton wrapper around the trained LogisticRegression model."""

    def __init__(self) -> None:
        self.model = None          # LogisticRegression
        self.vectorizer = None     # DictVectorizer
        self.classes = None        # ndarray of disease IDs
        self.feature_names: List[str] = []
        self.loaded: bool = False
        self.load_error: Optional[str] = None
        self.loaded_at: Optional[str] = None

    @property
    def classes_count(self) -> int:
        return len(self.classes) if self.classes is not None else 0

    @property
    def features_count(self) -> int:
        return self.model.n_features_in_ if self.model is not None else 0

    def load(self) -> None:
        """Load the model bundle from disk. Never raises — stays alive in degraded mode."""
        started = time.perf_counter()
        try:
            logger.info("Loading diagnosis model from %s", settings.MODEL_PATH)
            bundle = joblib.load(settings.MODEL_PATH)

            if not isinstance(bundle, dict):
                raise ValueError(
                    f"Expected a dict bundle with 'model', 'vectorizer', 'classes' keys, "
                    f"got {type(bundle).__name__}"
                )

            self.model = bundle["model"]
            self.vectorizer = bundle["vectorizer"]
            self.classes = bundle["classes"]
            self.feature_names = list(self.vectorizer.feature_names_)

            self.loaded = True
            self.load_error = None
            self.loaded_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            elapsed_ms = (time.perf_counter() - started) * 1000
            logger.info(
                "Diagnosis model loaded in %.1f ms — %d classes, %d features (%d from vectorizer + 1 sex)",
                elapsed_ms,
                len(self.classes),
                self.model.n_features_in_,
                len(self.feature_names),
            )
        except Exception as exc:
            self.loaded = False
            self.load_error = str(exc) or exc.__class__.__name__
            self.model = None
            self.vectorizer = None
            logger.error("Diagnosis model failed to load: %s", self.load_error, exc_info=True)

    def unload(self) -> None:
        self.loaded = False
        self.model = None
        self.vectorizer = None
        self.classes = None

    def _build_feature_dict(
        self,
        evidence_ids: List[str],
        patient_sex: str,
    ) -> Dict[str, float]:
        """Convert evidence_ids + sex into a feature dict for the DictVectorizer.

        - Boolean evidence_ids are set to 1.0
        - Multi-value evidence_ids (E_XX_XXXX) that have sub-features (E_XX_XXXX_@_V_YYY)
          are skipped for now — we'd need the specific value to set the right sub-feature
        - Sex is NOT in the dict — it's added as a separate column after vectorization
        """
        feature_set = set(self.feature_names)
        feature_dict: Dict[str, float] = {}

        for eid in evidence_ids:
            # Direct boolean feature
            if eid in feature_set:
                feature_dict[eid] = 1.0
            else:
                # Check if this evidence has multi-value sub-features
                prefix = f"{eid}_@_"
                sub_features = [f for f in self.feature_names if f.startswith(prefix)]
                if sub_features:
                    # For v1, skip multi-value evidences — we'd need the patient's answer
                    # to know which V_YYY to set. ParsBERT only gives us boolean presence.
                    logger.debug(
                        "Evidence %s has %d sub-features but no value provided — skipping",
                        eid,
                        len(sub_features),
                    )
                else:
                    logger.debug("Evidence %s not found in model features — skipping", eid)

        return feature_dict

    def predict(
        self,
        evidence_ids: List[str],
        patient_sex: str = "M",
    ) -> Tuple[np.ndarray, float]:
        """Run inference and return (probabilities, elapsed_ms).

        Returns a 1-D array of probabilities aligned with self.classes.
        """
        if not self.loaded or self.model is None or self.vectorizer is None:
            raise RuntimeError("Model not loaded")

        started = time.perf_counter()

        # 1. Build feature dict from evidence_ids
        feature_dict = self._build_feature_dict(evidence_ids, patient_sex)
        logger.info(
            "Feature dict: %d evidence_ids → %d features set",
            len(evidence_ids),
            len(feature_dict),
        )

        if not feature_dict:
            logger.warning("No matching features found for evidence_ids: %s", evidence_ids)
            # Return uniform probabilities
            n_classes = len(self.classes)
            return np.full(n_classes, 1.0 / n_classes), (time.perf_counter() - started) * 1000

        # 2. Vectorize
        X_vec = self.vectorizer.transform(feature_dict)  # sparse matrix (1, 1242)

        # 3. Add sex feature (1243rd column)
        #    1 = Male, 0 = Female
        sex_val = 1.0 if patient_sex.upper() == "M" else 0.0
        sex_col = sparse.csr_matrix(np.array([[sex_val]]))
        X_full = sparse.hstack([X_vec, sex_col], format="csr")  # (1, 1243)

        # 4. Predict probabilities
        probabilities = self.model.predict_proba(X_full)[0]  # shape: (457,)

        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "Diagnosis inference: %d classes, %.1f ms",
            len(probabilities),
            elapsed_ms,
        )

        return probabilities, elapsed_ms


# Module-level singleton
diagnosis_model = DiagnosisModel()
