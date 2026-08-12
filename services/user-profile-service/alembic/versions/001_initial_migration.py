# alembic/versions/001_initial_migration.py
"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create patient_profiles table
    op.create_table('patient_profiles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('birth_date', sa.Date(), nullable=False),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('height_cm', sa.SmallInteger(), nullable=True),
        sa.Column('weight_kg', sa.SmallInteger(), nullable=True),
        sa.Column('blood_type', sa.String(length=5), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('profile_image_url', sa.Text(), nullable=True),
        sa.Column('profile_image_key', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # Create patient_allergies table
    op.create_table('patient_allergies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('allergy_name', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('reaction_description', sa.Text(), nullable=True),
        sa.Column('diagnosed_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['patient_profiles.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create patient_current_medications table
    op.create_table('patient_current_medications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('medication_name', sa.String(length=150), nullable=False),
        sa.Column('dosage', sa.String(length=50), nullable=True),
        sa.Column('frequency', sa.String(length=50), nullable=True),
        sa.Column('prescribed_by', sa.String(length=100), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['patient_profiles.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create patient_chronic_conditions table
    op.create_table('patient_chronic_conditions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('condition_name', sa.String(length=150), nullable=False),
        sa.Column('icd10_code', sa.String(length=10), nullable=True),
        sa.Column('diagnosed_at', sa.Date(), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['patient_profiles.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create doctor_profiles table
    op.create_table('doctor_profiles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('specialty', sa.String(length=100), nullable=False),
        sa.Column('medical_license_number', sa.String(length=50), nullable=False),
        sa.Column('license_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('license_verified_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('education', sa.Text(), nullable=True),
        sa.Column('years_of_experience', sa.SmallInteger(), nullable=True),
        sa.Column('hospital_affiliations', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('office_address', sa.Text(), nullable=True),
        sa.Column('profile_image_url', sa.Text(), nullable=True),
        sa.Column('profile_image_key', sa.Text(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('medical_license_number')
    )
    
    # Create profile_audit_log table
    op.create_table('profile_audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('table_name', sa.String(length=50), nullable=False),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('performed_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('performed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_patient_allergies_user_id', 'patient_allergies', ['user_id'])
    op.create_index('idx_patient_medications_user_id', 'patient_current_medications', ['user_id'])
    op.create_index('idx_patient_conditions_user_id', 'patient_chronic_conditions', ['user_id'])
    op.create_index('idx_audit_log_user_id', 'profile_audit_log', ['user_id'])
    op.create_index('idx_audit_log_performed_at', 'profile_audit_log', ['performed_at'])


def downgrade() -> None:
    op.drop_table('profile_audit_log')
    op.drop_table('doctor_profiles')
    op.drop_table('patient_chronic_conditions')
    op.drop_table('patient_current_medications')
    op.drop_table('patient_allergies')
    op.drop_table('patient_profiles')