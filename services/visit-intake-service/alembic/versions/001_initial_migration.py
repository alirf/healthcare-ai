"""Initial migration — visit intake service

Revision ID: 001
Revises:
Create Date: 2026-09-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Visits ──────────────────────────────────────────────────────────
    op.create_table(
        "visits",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("medical_record_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="intake"),
        sa.Column("chief_complaint", sa.Text(), nullable=True),
        sa.Column("patient_notes", sa.Text(), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("doctor_joined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_visits_patient_id", "visits", ["patient_id"])
    op.create_index("ix_visits_doctor_id", "visits", ["doctor_id"])
    op.create_index("ix_visits_medical_record_id", "visits", ["medical_record_id"])
    op.create_index("ix_visits_status", "visits", ["status"])

    # ── Intake messages (text / file) ───────────────────────────────────
    op.create_table(
        "visit_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_type", sa.String(length=20), nullable=True, server_default="patient"),
        sa.Column("message_type", sa.String(length=10), nullable=True, server_default="text"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("attachment_name", sa.String(length=255), nullable=True),
        sa.Column("attachment_content_type", sa.String(length=100), nullable=True),
        sa.Column("attachment_size", sa.Integer(), nullable=True),
        sa.Column("attachment_key", sa.Text(), nullable=True),
        sa.Column("attachment_url", sa.Text(), nullable=True),
        sa.Column("sequence", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_visit_messages_visit_id", "visit_messages", ["visit_id"])

    # ── Symptoms (manual + AI) ──────────────────────────────────────────
    op.create_table(
        "visit_symptoms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("symptom_name", sa.String(length=150), nullable=False),
        sa.Column("source", sa.String(length=10), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=True),
        sa.Column("body_part", sa.String(length=100), nullable=True),
        sa.Column("onset_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_description", sa.String(length=100), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("ai_model_version", sa.String(length=50), nullable=True),
        sa.Column("doctor_confirmed", sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("visit_id", "symptom_name", "source", name="uq_visit_symptom_source"),
    )
    op.create_index("ix_visit_symptoms_visit_id", "visit_symptoms", ["visit_id"])

    # ── AI disease suggestions ──────────────────────────────────────────
    op.create_table(
        "ai_disease_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("disease_name", sa.String(length=150), nullable=False),
        sa.Column("icd10_code", sa.String(length=10), nullable=True),
        sa.Column("probability", sa.Float(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("doctor_decision", sa.String(length=20), nullable=True, server_default="pending"),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_disease_suggestions_visit_id", "ai_disease_suggestions", ["visit_id"])

    # ── AI prescription drafts ──────────────────────────────────────────
    op.create_table(
        "ai_prescription_drafts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("items", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("ai_notes", sa.Text(), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_prescription_drafts_visit_id", "ai_prescription_drafts", ["visit_id"])

    # ── Final prescriptions ─────────────────────────────────────────────
    op.create_table(
        "final_prescriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("diagnosis_text", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("visit_id"),
    )
    op.create_index("ix_final_prescriptions_doctor_id", "final_prescriptions", ["doctor_id"])

    # ── Prescription items ──────────────────────────────────────────────
    op.create_table(
        "prescription_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prescription_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("drug_name", sa.String(length=150), nullable=False),
        sa.Column("dosage", sa.String(length=50), nullable=True),
        sa.Column("frequency", sa.String(length=50), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.String(length=50), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True, server_default="0"),
        sa.ForeignKeyConstraint(["prescription_id"], ["final_prescriptions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_prescription_items_prescription_id", "prescription_items", ["prescription_id"])

    # ── Doctor-patient chat ─────────────────────────────────────────────
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_role", sa.String(length=10), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_messages_visit_id", "chat_messages", ["visit_id"])


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("prescription_items")
    op.drop_table("final_prescriptions")
    op.drop_table("ai_prescription_drafts")
    op.drop_table("ai_disease_suggestions")
    op.drop_table("visit_symptoms")
    op.drop_table("visit_messages")
    op.drop_table("visits")
