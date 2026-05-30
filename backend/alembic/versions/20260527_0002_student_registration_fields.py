"""Add student registration workflow fields.

Revision ID: 20260527_0002
Revises: 20260523_0001
Create Date: 2026-05-27
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260527_0002"
down_revision = "20260523_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("students", sa.Column("student_phone", sa.String(length=80), nullable=True))
    op.add_column("students", sa.Column("mother_phone", sa.String(length=80), nullable=True))
    op.add_column("students", sa.Column("father_phone", sa.String(length=80), nullable=True))
    op.add_column("student_education_paths", sa.Column("stream", sa.String(length=80), nullable=True))


def downgrade() -> None:
    op.drop_column("student_education_paths", "stream")
    op.drop_column("students", "father_phone")
    op.drop_column("students", "mother_phone")
    op.drop_column("students", "student_phone")
