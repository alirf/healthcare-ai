"""Business logic for visits, messages, symptoms, AI results and prescriptions."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.visit import Visit
from app.models.message import VisitMessage
from app.models.clinical import (
    VisitSymptom,
    AIDiseaseSuggestion,
    AIPrescriptionDraft,
    FinalPrescription,
    PrescriptionItem,
)
from app.models.chat import ChatMessage
from app.schemas.visit import VisitCreate
from app.schemas.clinical import (
    SymptomCreate,
    AISymptomsBulkInput,
    DiseaseSuggestionsBulkInput,
    AIPrescriptionDraftInput,
    FinalPrescriptionCreate,
)
from app.exceptions import InvalidVisitStateError


# Valid status transitions (visit lifecycle)
ALLOWED_TRANSITIONS = {
    "intake": {"ai_processing", "cancelled"},
    "ai_processing": {"doctor_assigned", "cancelled"},
    "doctor_assigned": {"in_chat", "cancelled"},
    "in_chat": {"prescription_pending", "completed", "cancelled"},
    "prescription_pending": {"completed", "cancelled"},
    "completed": {"closed"},
    "closed": set(),
    "cancelled": set(),
}


class VisitService:
    """Service layer for visit intake operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================================================================
    # VISIT LIFECYCLE
    # =====================================================================

    async def create_visit(self, patient_id: UUID, data: VisitCreate) -> Visit:
        visit = Visit(patient_id=patient_id, **data.model_dump())
        self.db.add(visit)
        await self.db.flush()
        return visit

    async def get_visit(self, visit_id: UUID) -> Optional[Visit]:
        """Get a visit with all related data eagerly loaded."""
        result = await self.db.execute(select(Visit).where(Visit.id == visit_id))
        return result.scalar_one_or_none()

    async def list_patient_visits(self, patient_id: UUID) -> list[Visit]:
        result = await self.db.execute(
            select(Visit)
            .where(Visit.patient_id == patient_id)
            .order_by(Visit.started_at.desc())
        )
        return result.scalars().all()

    async def list_doctor_visits(self, doctor_id: UUID) -> list[Visit]:
        result = await self.db.execute(
            select(Visit)
            .where(
                Visit.doctor_id == doctor_id,
                Visit.status.notin_(["closed", "cancelled"]),
            )
            .order_by(Visit.started_at.desc())
        )
        return result.scalars().all()

    async def list_queue(self) -> list[Visit]:
        """Unassigned visits that are ready for a doctor (AI finished processing)."""
        result = await self.db.execute(
            select(Visit)
            .where(Visit.status == "doctor_assigned", Visit.doctor_id.is_(None))
            .order_by(Visit.started_at.asc())
        )
        return result.scalars().all()

    async def transition(self, visit: Visit, new_status: str) -> Visit:
        allowed = ALLOWED_TRANSITIONS.get(visit.status, set())
        if new_status not in allowed:
            raise InvalidVisitStateError(
                f"Cannot move visit from '{visit.status}' to '{new_status}'"
            )
        visit.status = new_status
        now = datetime.utcnow()
        if new_status == "in_chat" and visit.doctor_joined_at is None:
            visit.doctor_joined_at = now
        if new_status == "completed" and visit.completed_at is None:
            visit.completed_at = now
        await self.db.flush()
        return visit

    async def claim(self, visit: Visit, doctor_id: UUID) -> Visit:
        if visit.doctor_id is not None:
            raise InvalidVisitStateError("Visit is already assigned to a doctor")
        if visit.status != "doctor_assigned":
            raise InvalidVisitStateError(
                f"Visit is not ready for a doctor (status: {visit.status})"
            )
        visit.doctor_id = doctor_id
        await self.transition(visit, "in_chat")
        return visit

    async def link_medical_record(self, visit: Visit, medical_record_id: UUID) -> Visit:
        visit.medical_record_id = medical_record_id
        await self.db.flush()
        return visit

    # =====================================================================
    # INTAKE MESSAGES (text / file)
    # =====================================================================

    async def add_message(
        self,
        visit_id: UUID,
        content: Optional[str] = None,
        sender_type: str = "patient",
        message_type: str = "text",
        attachment: Optional[dict] = None,
    ) -> VisitMessage:
        result = await self.db.execute(
            select(func.count())
            .select_from(VisitMessage)
            .where(VisitMessage.visit_id == visit_id)
        )
        sequence = result.scalar_one() + 1

        message = VisitMessage(
            visit_id=visit_id,
            sender_type=sender_type,
            message_type=message_type,
            content=content,
            sequence=sequence,
            sent_at=datetime.utcnow(),
            **(attachment or {}),
        )
        self.db.add(message)
        await self.db.flush()
        return message

    async def list_messages(self, visit_id: UUID) -> list[VisitMessage]:
        result = await self.db.execute(
            select(VisitMessage)
            .where(VisitMessage.visit_id == visit_id)
            .order_by(VisitMessage.sequence.asc())
        )
        return result.scalars().all()

    # =====================================================================
    # SYMPTOMS (manual + AI)
    # =====================================================================

    async def add_symptom(
        self, visit_id: UUID, data: SymptomCreate, source: str = "manual"
    ) -> VisitSymptom:
        symptom = VisitSymptom(visit_id=visit_id, source=source, **data.model_dump())
        self.db.add(symptom)
        await self.db.flush()
        return symptom

    async def bulk_add_ai_symptoms(
        self, visit_id: UUID, payload: AISymptomsBulkInput
    ) -> list[VisitSymptom]:
        """Add AI-detected symptoms, skipping ones already stored for this visit."""
        result = await self.db.execute(
            select(VisitSymptom.symptom_name).where(
                VisitSymptom.visit_id == visit_id,
                VisitSymptom.source == "ai",
            )
        )
        existing = {name.strip().lower() for name in result.scalars().all()}

        added = []
        for item in payload.symptoms:
            if item.symptom_name.strip().lower() in existing:
                continue
            symptom = VisitSymptom(
                visit_id=visit_id,
                source="ai",
                ai_model_version=payload.model_version,
                **item.model_dump(),
            )
            self.db.add(symptom)
            added.append(symptom)
        await self.db.flush()
        return added

    async def list_symptoms(self, visit_id: UUID) -> list[VisitSymptom]:
        result = await self.db.execute(
            select(VisitSymptom)
            .where(VisitSymptom.visit_id == visit_id)
            .order_by(VisitSymptom.created_at.asc())
        )
        return result.scalars().all()

    async def delete_symptom(self, visit_id: UUID, symptom_id: UUID) -> bool:
        result = await self.db.execute(
            select(VisitSymptom).where(
                VisitSymptom.visit_id == visit_id,
                VisitSymptom.id == symptom_id,
                VisitSymptom.source == "manual",  # AI symptoms are only removed by AI re-run
            )
        )
        symptom = result.scalar_one_or_none()
        if not symptom:
            return False
        await self.db.delete(symptom)
        await self.db.flush()
        return True

    # =====================================================================
    # AI DISEASE SUGGESTIONS
    # =====================================================================

    async def replace_disease_suggestions(
        self, visit_id: UUID, payload: DiseaseSuggestionsBulkInput
    ) -> list[AIDiseaseSuggestion]:
        """AI re-runs replace the previous suggestion list entirely."""
        await self.db.execute(
            delete(AIDiseaseSuggestion).where(AIDiseaseSuggestion.visit_id == visit_id)
        )

        suggestions = []
        for item in payload.suggestions:
            suggestion = AIDiseaseSuggestion(
                visit_id=visit_id,
                model_version=payload.model_version,
                **item.model_dump(),
            )
            self.db.add(suggestion)
            suggestions.append(suggestion)
        await self.db.flush()
        return suggestions

    async def list_disease_suggestions(self, visit_id: UUID) -> list[AIDiseaseSuggestion]:
        result = await self.db.execute(
            select(AIDiseaseSuggestion)
            .where(AIDiseaseSuggestion.visit_id == visit_id)
            .order_by(AIDiseaseSuggestion.rank.asc())
        )
        return result.scalars().all()

    async def decide_suggestion(
        self, visit_id: UUID, suggestion_id: UUID, decision: str, doctor_id: UUID
    ) -> Optional[AIDiseaseSuggestion]:
        result = await self.db.execute(
            select(AIDiseaseSuggestion).where(
                AIDiseaseSuggestion.visit_id == visit_id,
                AIDiseaseSuggestion.id == suggestion_id,
            )
        )
        suggestion = result.scalar_one_or_none()
        if not suggestion:
            return None
        suggestion.doctor_decision = decision
        suggestion.decided_by = doctor_id
        suggestion.decided_at = datetime.utcnow()
        await self.db.flush()
        return suggestion

    # =====================================================================
    # AI PRESCRIPTION DRAFT
    # =====================================================================

    async def save_draft(
        self, visit_id: UUID, payload: AIPrescriptionDraftInput
    ) -> AIPrescriptionDraft:
        """Save a new draft; previous drafts are marked superseded."""
        result = await self.db.execute(
            select(AIPrescriptionDraft).where(
                AIPrescriptionDraft.visit_id == visit_id,
                AIPrescriptionDraft.status == "draft",
            )
        )
        for old in result.scalars().all():
            old.status = "superseded"

        draft = AIPrescriptionDraft(
            visit_id=visit_id,
            items=[item.model_dump() for item in payload.items],
            ai_notes=payload.ai_notes,
            model_version=payload.model_version,
        )
        self.db.add(draft)
        await self.db.flush()
        return draft

    async def get_latest_draft(self, visit_id: UUID) -> Optional[AIPrescriptionDraft]:
        result = await self.db.execute(
            select(AIPrescriptionDraft)
            .where(
                AIPrescriptionDraft.visit_id == visit_id,
                AIPrescriptionDraft.status == "draft",
            )
            .order_by(AIPrescriptionDraft.created_at.desc())
        )
        return result.scalars().first()

    # =====================================================================
    # FINAL PRESCRIPTION (doctor)
    # =====================================================================

    async def issue_final_prescription(
        self, visit_id: UUID, doctor_id: UUID, data: FinalPrescriptionCreate
    ) -> FinalPrescription:
        visit = await self.get_visit(visit_id)
        if visit is None:
            raise InvalidVisitStateError("Visit not found")
        if visit.final_prescription is not None:
            raise InvalidVisitStateError("Final prescription already issued for this visit")

        prescription = FinalPrescription(
            visit_id=visit_id,
            doctor_id=doctor_id,
            diagnosis_text=data.diagnosis_text,
            notes=data.notes,
            issued_at=datetime.utcnow(),
        )
        self.db.add(prescription)
        await self.db.flush()

        for index, item in enumerate(data.items):
            self.db.add(
                PrescriptionItem(
                    prescription_id=prescription.id,
                    sort_order=index,
                    **item.model_dump(),
                )
            )
        await self.db.flush()

        await self.transition(visit, "completed")
        return await self.get_final_prescription(visit_id)

    async def get_final_prescription(self, visit_id: UUID) -> Optional[FinalPrescription]:
        result = await self.db.execute(
            select(FinalPrescription)
            .options(selectinload(FinalPrescription.items))
            .where(FinalPrescription.visit_id == visit_id)
        )
        return result.scalar_one_or_none()

    # =====================================================================
    # DOCTOR <-> PATIENT CHAT
    # =====================================================================

    async def add_chat_message(
        self, visit_id: UUID, sender_id: UUID, sender_role: str, content: str
    ) -> ChatMessage:
        message = ChatMessage(
            visit_id=visit_id,
            sender_id=sender_id,
            sender_role=sender_role,
            content=content,
            sent_at=datetime.utcnow(),
        )
        self.db.add(message)
        await self.db.flush()
        return message

    async def list_chat_messages(self, visit_id: UUID) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.visit_id == visit_id)
            .order_by(ChatMessage.sent_at.asc(), ChatMessage.created_at.asc())
        )
        return result.scalars().all()
