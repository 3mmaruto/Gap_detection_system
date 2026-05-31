"""Add student and teacher portal support tables.

Revision ID: 20260531_0003
Revises: 20260527_0002
Create Date: 2026-05-31
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260531_0003"
down_revision = "20260527_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("students", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_unique_constraint("uq_students_user_id", "students", ["user_id"])
    op.create_foreign_key("fk_students_user_id_users", "students", "users", ["user_id"], ["id"])

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id"), nullable=True),
        sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id"), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False, server_default="ANNOUNCEMENT"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "post_attachments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id"), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=True),
    )
    op.create_table(
        "schedule_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("school_id", sa.Integer(), sa.ForeignKey("schools.id"), nullable=False),
        sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("assigned_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("day", sa.String(length=12), nullable=False),
        sa.Column("period", sa.Integer(), nullable=False),
        sa.Column("level_id", sa.Integer(), sa.ForeignKey("class_sections.id"), nullable=True),
        sa.UniqueConstraint("school_id", "day", "period", name="uq_school_schedule_slot"),
    )
    op.create_table(
        "syllabus_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("schedule_item_id", sa.Integer(), sa.ForeignKey("schedule_items.id"), nullable=False),
        sa.Column("topic_id", sa.Integer(), sa.ForeignKey("curriculum_topics.id"), nullable=True),
        sa.Column("assigned_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("topic_title", sa.String(length=255), nullable=False),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "part_grades",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("assigned_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("max_grade", sa.Float(), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False, server_default="SYSTEM"),
        sa.Column("seen", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("party1", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("party2", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint("party1", "party2", name="uq_conversation_parties"),
    )
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("conversations.id"), nullable=False),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("notifications")
    op.drop_table("part_grades")
    op.drop_table("syllabus_items")
    op.drop_table("schedule_items")
    op.drop_table("post_attachments")
    op.drop_table("posts")
    op.drop_constraint("fk_students_user_id_users", "students", type_="foreignkey")
    op.drop_constraint("uq_students_user_id", "students", type_="unique")
    op.drop_column("students", "user_id")
