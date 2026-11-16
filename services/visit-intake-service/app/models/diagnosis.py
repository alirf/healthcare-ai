"""SQLAlchemy models for AI diagnosis suggestions and final diagnoses.

Two new tables in visits_db:

1. ai_diagnosis_suggestions
   One row per (visit, disease) prediction. Created when ai-triage-service
   returns a VisitDiagnosisResponse — we flatten predictions[] into rows so
   the doctor can sort / filter / pick one easily.

2. final_diagnoses
   One row per visit (uniqueness enforced by visit_id). Created when the
   doctor submits POST /visits/{id}/final-diagnosis. The visit status is
   also updated to "completed" at the same time.

Both tables use native PostgreSQL UUID columns. They are intentionally
independent of the existing visits table's ORM model — visit_id is just a
UUID FK (we don't define the relationship here so this module is fully
drop-in: import it in app/database.py or app/models/__init__.py and the
tables are created on first `alembic upgrade head` or `Base.metadata.create_all`).
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

# IMPORTANT: import Base from the existing app.database module.
# We assume the project already declares a declarative Base. If your project
# uses a different import path (e.g. from app.models.base import Base),
# update this import to match.
try:
    from app.database import Base
except ImportError:  # pragma: no cover — fallback so the module loads standalone
    from sqlalchemy.orm import DeclarativeBase

    class Base(DeclarativeBase):  # type: ignore[no-redef]
        pass


class AIDiagnosisSuggestion(Base):
    """One stored AI diagnosis suggestion (a single disease prediction).

    Rows are wiped and re-created every time the doctor re-triggers
    POST /visits/{id}/diagnose — there's no need to keep stale predictions
    around, but the most recent set is persisted so the doctor can refresh
    the page without losing the suggestions.
    """

    __tablename__ = "ai_diagnosis_suggestions"
    __table_args__ = (
        # One suggestion per (visit, disease) — re-diagnosis overwrites
        UniqueConstraint("visit_id", "disease_id", name="uq_ai_diag_visit_disease"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    visit_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("visits.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    disease_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    disease_name_fa: Mapped[str] = mapped_column(String(300), nullable=False)
    disease_name_en: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    icd10: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ml_probability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    rule_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    combined_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, index=True)
    is_emergency: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    rank: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    matched_evidences: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    absent_evidences: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<AIDiagnosisSuggestion {self.disease_id} score={self.combined_score:.3f}>"


class FinalDiagnosis(Base):
    """The doctor's final diagnosis for a visit. One row per visit.

    Created when the doctor submits POST /visits/{id}/final-diagnosis.
    The visit status is also moved to "completed" at the same time.
    """

    __tablename__ = "final_diagnoses"
    __table_args__ = (UniqueConstraint("visit_id", name="uq_final_diag_per_visit"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    visit_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("visits.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    doctor_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True, nullable=False)
    disease_name_fa: Mapped[str] = mapped_column(String(300), nullable=False)
    disease_name_en: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    icd10: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    disease_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    selected_suggestion_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("ai_diagnosis_suggestions.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    requires_follow_up: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    follow_up_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<FinalDiagnosis visit={self.visit_id} disease={self.disease_name_fa}>"
