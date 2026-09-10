"""Initial migration — medical record service

Revision ID: 001
Revises:
Create Date: 2026-09-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Medical records ─────────────────────────────────────────────────
    op.create_table(
        "medical_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icd10_code", sa.String(length=10), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_medical_records_patient_id", "medical_records", ["patient_id"])
    op.create_index("ix_medical_records_record_type", "medical_records", ["record_type"])
    op.create_index("ix_medical_records_status", "medical_records", ["status"])

    # ── Record <-> visit junction (visits live in another database) ─────
    op.create_table(
        "record_visits",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("added_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["record_id"], ["medical_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_id", "visit_id", name="uq_record_visit"),
    )
    op.create_index("ix_record_visits_record_id", "record_visits", ["record_id"])
    op.create_index("ix_record_visits_visit_id", "record_visits", ["visit_id"])

    # ── Record files (bytes in MinIO) ───────────────────────────────────
    op.create_table(
        "record_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["record_id"], ["medical_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_record_files_record_id", "record_files", ["record_id"])


def downgrade() -> None:
    op.drop_table("record_files")
    op.drop_table("record_visits")
    op.drop_table("medical_records")
