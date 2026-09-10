import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VisitMessage(Base):
    """A message sent during the intake phase (patient, or AI/system follow-ups).

    Text and/or file attachment, with full timestamps.
    """

    __tablename__ = "visit_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False, index=True
    )

    sender_type: Mapped[str] = mapped_column(String(20), default="patient")  # patient | ai | system
    message_type: Mapped[str] = mapped_column(String(10), default="text")    # text | file

    content: Mapped[Optional[str]] = mapped_column(Text)

    # File attachment metadata (file bytes live in MinIO)
    attachment_name: Mapped[Optional[str]] = mapped_column(String(255))
    attachment_content_type: Mapped[Optional[str]] = mapped_column(String(100))
    attachment_size: Mapped[Optional[int]] = mapped_column(Integer)
    attachment_key: Mapped[Optional[str]] = mapped_column(Text)
    attachment_url: Mapped[Optional[str]] = mapped_column(Text)

    sequence: Mapped[int] = mapped_column(Integer, default=0)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    visit: Mapped["Visit"] = relationship(back_populates="messages")
