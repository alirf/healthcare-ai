"""Full visit context — used by AI services and doctors."""
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.visit import VisitResponse, MessageResponse
from app.schemas.clinical import (
    SymptomResponse,
    DiseaseSuggestionResponse,
    AIPrescriptionDraftResponse,
    FinalPrescriptionResponse,
)
from app.schemas.chat import ChatMessageResponse


class VisitContextResponse(BaseModel):
    """Everything known about a visit in one payload."""
    visit: VisitResponse
    messages: List[MessageResponse] = []
    symptoms: List[SymptomResponse] = []
    disease_suggestions: List[DiseaseSuggestionResponse] = []
    prescription_drafts: List[AIPrescriptionDraftResponse] = []
    chat_messages: List[ChatMessageResponse] = []
    final_prescription: Optional[FinalPrescriptionResponse] = None
