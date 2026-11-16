"""Shared fixtures for ai-nlp-service tests.

The real NLPService is replaced by FakeNLPService so tests never touch
torch, the checkpoint or the HuggingFace hub. The fake reuses the real
post-processing logic (threshold -> sort -> hierarchy filter -> top_k)
via postprocess_probabilities(), only the torch part is faked.
"""
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402
from app.schemas.nlp import DetectedEvidence  # noqa: E402
from app.services import nlp_service as nlp_service_module  # noqa: E402
from app.services.nlp_service import postprocess_probabilities  # noqa: E402

TEST_INTERNAL_API_KEY = "internal-secret-key-12345"

AUTH_HEADERS = {"X-Internal-API-Key": TEST_INTERNAL_API_KEY}

# Fake evidence_list (same shape as evidence_list_clean.json: dict keyed by
# evidence_id). E_19_0001 is a root evidence (code_question == own id) and
# parent of E_19_0002; E_19_0003 is another root.
FAKE_EVIDENCE_LIST: Dict[str, Dict[str, Any]] = {
    "E_19_0001": {
        "name": "skin_lesions",
        "code_question": "E_19_0001",
        "question_en": "Do you have any lesions, redness or problems on your skin?",
        "is_antecedent": False,
        "default_value": 0,
        "value_meaning": {},
        "possible-values": [],
        "data_type": "B",
        "name_fa": "ضایعات پوستی",
        "question_fa": "آیا ضایعه، قرمزی یا مشکل پوستی مرتبط با علت مراجعه دارید؟",
    },
    "E_19_0002": {
        "name": "lesion_color",
        "code_question": "E_19_0001",
        "question_en": "What color is the rash?",
        "is_antecedent": False,
        "default_value": "V_11",
        "value_meaning": {
            "V_11": {"fa": "نامشخص", "en": "NA"},
            "V_157": {"fa": "قرمز", "en": "red"},
        },
        "possible-values": ["V_11", "V_157"],
        "data_type": "C",
        "name_fa": "رنگ ضایعه",
        "question_fa": "راش/ضایعه چه رنگی است؟",
    },
    "E_19_0003": {
        "name": "fever",
        "code_question": "E_19_0003",
        "question_en": "Do you have fever?",
        "is_antecedent": False,
        "default_value": 0,
        "value_meaning": {},
        "possible-values": [],
        "data_type": "B",
        "name_fa": "تب",
        "question_fa": "آیا تب دارید؟",
    },
}


class FakeNLPService:
    """Test double mirroring NLPService's public interface, without torch."""

    def __init__(
        self,
        predictions: Optional[List[Tuple[str, float]]] = None,
        loaded: bool = True,
    ) -> None:
        self.loaded = loaded
        self.load_error = None if loaded else "checkpoint not found (fake)"
        self.device = "cpu"
        self.eid_list: List[str] = sorted(FAKE_EVIDENCE_LIST.keys())
        self.eid_info: Dict[str, Dict[str, Any]] = FAKE_EVIDENCE_LIST
        self.loaded_at = "2026-01-15T10:30:00Z"
        self.training_metadata: Dict[str, Any] = {"f1": 0.84, "epoch": 3}
        # Default predictions from the spec's happy-path fixture.
        self.predictions = predictions if predictions is not None else [
            ("E_19_0001", 0.87),
            ("E_19_0002", 0.51),
        ]

    @property
    def evidence_count(self) -> int:
        return len(self.eid_list)

    async def extract(
        self,
        text: str,
        threshold: float,
        top_k: Optional[int] = None,
        apply_hierarchy_filter: bool = True,
    ) -> Tuple[List[DetectedEvidence], float]:
        probs = np.zeros(len(self.eid_list), dtype=float)
        for eid, prob in self.predictions:
            probs[self.eid_list.index(eid)] = prob

        detected = postprocess_probabilities(
            probs=probs,
            eid_list=self.eid_list,
            eid_info=self.eid_info,
            threshold=threshold,
            top_k=top_k,
            apply_hierarchy_filter=apply_hierarchy_filter,
        )
        return detected, 12.3


@pytest.fixture
def fake_nlp_service() -> FakeNLPService:
    return FakeNLPService()


@pytest_asyncio.fixture
async def client(
    monkeypatch: pytest.MonkeyPatch,
    fake_nlp_service: FakeNLPService,
) -> AsyncClient:
    """HTTPX async client bound to the ASGI app with the fake service injected.

    Tests that need custom predictions re-patch
    app.services.nlp_service.nlp_service with their own FakeNLPService.
    """
    monkeypatch.setattr(nlp_service_module, "nlp_service", fake_nlp_service)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client
