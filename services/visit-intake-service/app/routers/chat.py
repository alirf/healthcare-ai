"""Doctor <-> patient chat endpoints (both roles)."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.exceptions import VisitNotFoundError, ForbiddenAccessError, InvalidVisitStateError
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.services.visit_service import VisitService

router = APIRouter(prefix="/visits", tags=["Consultation Chat"])

# Chat is open during these visit statuses
CHAT_OPEN_STATUSES = {"in_chat", "prescription_pending"}


async def get_participant_visit(
    visit_id: UUID,
    current_user: dict,
    db: AsyncSession,
):
    """Allow only the owning patient or the assigned doctor."""
    service = VisitService(db)
    visit = await service.get_visit(visit_id)
    if not visit:
        raise VisitNotFoundError()

    user_id = UUID(current_user["sub"])
    roles = current_user.get("roles", [])
    if isinstance(roles, str):
        roles = [roles]
    role = current_user.get("role")
    if role:
        roles.append(role)

    is_owner = "patient" in roles and visit.patient_id == user_id
    is_doctor = "doctor" in roles and visit.doctor_id == user_id
    if not (is_owner or is_doctor):
        raise ForbiddenAccessError("You are not a participant of this visit")
    return visit, "patient" if is_owner else "doctor"


@router.get("/{visit_id}/chat", response_model=List[ChatMessageResponse])
async def list_chat_messages(
    visit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the whole doctor-patient chat of the visit."""
    service = VisitService(db)
    await get_participant_visit(visit_id, current_user, db)
    return await service.list_chat_messages(visit_id)


@router.post("/{visit_id}/chat", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_chat_message(
    visit_id: UUID,
    data: ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a chat message (doctor or patient)."""
    service = VisitService(db)
    visit, role = await get_participant_visit(visit_id, current_user, db)
    if visit.status not in CHAT_OPEN_STATUSES:
        raise InvalidVisitStateError(
            f"Chat is not open for this visit (status: {visit.status})"
        )
    return await service.add_chat_message(
        visit_id, UUID(current_user["sub"]), role, data.content
    )
