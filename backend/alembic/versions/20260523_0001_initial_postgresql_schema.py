"""Initial PostgreSQL schema for KGDS.

Revision ID: 20260523_0001
Revises:
Create Date: 2026-05-23
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260523_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "schools",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=True),
        sa.Column("type", sa.String(length=80), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("region", sa.String(length=120), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=80), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "subjects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name_en", sa.String(length=160), nullable=True),
        sa.Column("name_native", sa.String(length=160), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "curriculum_systems",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("language", sa.String(length=80), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "assessment_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "model_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("model_name", sa.String(length=160), nullable=False),
        sa.Column("version", sa.String(length=80), nullable=False),
        sa.Column("task", sa.String(length=160), nullable=False),
        sa.Column("artifact_uri", sa.Text(), nullable=True),
        sa.Column("training_dataset", sa.String(length=255), nullable=True),
        sa.Column("metrics_json", postgresql.JSONB(), nullable=True),
        sa.Column("feature_schema_json", postgresql.JSONB(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "analytics_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("snapshot_type", sa.String(length=120), nullable=False),
        sa.Column("scope_type", sa.String(length=120), nullable=True),
        sa.Column("scope_id", sa.Integer(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("metrics_json", postgresql.JSONB(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "system_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("severity", sa.String(length=40), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "academic_years",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=True),
        sa.Column("ministry_scope", sa.String(length=160), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role_id", "school_id", name="uq_user_role_scope"),
    )
    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )
    op.create_table(
        "curriculum_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("curriculum_system_id", sa.Integer(), nullable=False),
        sa.Column("version_name", sa.String(length=160), nullable=False),
        sa.Column("year_from", sa.Integer(), nullable=True),
        sa.Column("year_to", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["curriculum_system_id"], ["curriculum_systems.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "curriculum_import_batches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(length=80), nullable=False),
        sa.Column("source_uri", sa.Text(), nullable=True),
        sa.Column("imported_by_user_id", sa.Integer(), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("summary_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["imported_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "class_sections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("academic_year_id", sa.Integer(), nullable=False),
        sa.Column("grade", sa.String(length=40), nullable=False),
        sa.Column("stream", sa.String(length=80), nullable=True),
        sa.Column("section_name", sa.String(length=80), nullable=False),
        sa.Column("homeroom_teacher_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.ForeignKeyConstraint(["academic_year_id"], ["academic_years.id"]),
        sa.ForeignKeyConstraint(["homeroom_teacher_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("student_number", sa.String(length=80), nullable=True),
        sa.Column("first_name", sa.String(length=120), nullable=True),
        sa.Column("father_name", sa.String(length=120), nullable=True),
        sa.Column("mother_name", sa.String(length=120), nullable=True),
        sa.Column("last_name", sa.String(length=120), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(length=40), nullable=True),
        sa.Column("nationality", sa.String(length=120), nullable=True),
        sa.Column("current_grade", sa.String(length=40), nullable=True),
        sa.Column("current_stream", sa.String(length=80), nullable=True),
        sa.Column("current_section_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["current_section_id"], ["class_sections.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("school_id", "student_number", name="uq_school_student_number"),
    )
    op.create_table(
        "student_cases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("school_id", sa.Integer(), nullable=True),
        sa.Column("case_code", sa.String(length=120), nullable=False),
        sa.Column("origin_country", sa.String(length=120), nullable=True),
        sa.Column("target_country", sa.String(length=120), nullable=False),
        sa.Column("target_grade", sa.String(length=40), nullable=False),
        sa.Column("target_stream", sa.String(length=80), nullable=True),
        sa.Column("subject_focus", sa.String(length=120), nullable=False),
        sa.Column("grades_studied_abroad", postgresql.JSONB(), nullable=True),
        sa.Column("last_completed_grade_abroad", sa.String(length=40), nullable=True),
        sa.Column("overall_difficulty", sa.Float(), nullable=True),
        sa.Column("math_difficulty", sa.Float(), nullable=True),
        sa.Column("reading_difficulty", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("raw_input_json", postgresql.JSONB(), nullable=True),
        sa.Column("source_type", sa.String(length=80), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("case_code", name="uq_student_case_code"),
    )
    op.create_table(
        "teacher_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("teacher_user_id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("class_section_id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=True),
        sa.Column("academic_year_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.ForeignKeyConstraint(["academic_year_id"], ["academic_years.id"]),
        sa.ForeignKeyConstraint(["class_section_id"], ["class_sections.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"]),
        sa.ForeignKeyConstraint(["teacher_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "curriculum_topics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("external_topic_id", sa.String(length=160), nullable=True),
        sa.Column("curriculum_system_id", sa.Integer(), nullable=False),
        sa.Column("curriculum_version_id", sa.Integer(), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("grade", sa.String(length=40), nullable=False),
        sa.Column("stream", sa.String(length=80), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("subject_branch", sa.String(length=160), nullable=True),
        sa.Column("unit_name_native", sa.String(length=255), nullable=True),
        sa.Column("unit_name_en", sa.String(length=255), nullable=True),
        sa.Column("topic_name_native", sa.String(length=255), nullable=False),
        sa.Column("topic_name_en", sa.String(length=255), nullable=True),
        sa.Column("topic_order", sa.Float(), nullable=True),
        sa.Column("is_core_topic", sa.Boolean(), nullable=False),
        sa.Column("difficulty_level", sa.String(length=80), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["curriculum_system_id"], ["curriculum_systems.id"]),
        sa.ForeignKeyConstraint(["curriculum_version_id"], ["curriculum_versions.id"]),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_topic_id", name="uq_curriculum_topic_external"),
    )
    op.create_table(
        "curriculum_edges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_topic_id", sa.Integer(), nullable=False),
        sa.Column("target_topic_id", sa.Integer(), nullable=False),
        sa.Column("relation_type", sa.String(length=80), nullable=False),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["source_topic_id"], ["curriculum_topics.id"]),
        sa.ForeignKeyConstraint(["target_topic_id"], ["curriculum_topics.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_topic_id", "target_topic_id", "relation_type", name="uq_curriculum_edge"),
    )
    op.create_table(
        "curriculum_equivalences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("topic_id_a", sa.Integer(), nullable=False),
        sa.Column("topic_id_b", sa.Integer(), nullable=False),
        sa.Column("equivalence_type", sa.String(length=80), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=160), nullable=True),
        sa.ForeignKeyConstraint(["topic_id_a"], ["curriculum_topics.id"]),
        sa.ForeignKeyConstraint(["topic_id_b"], ["curriculum_topics.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("class_section_id", sa.Integer(), nullable=False),
        sa.Column("academic_year_id", sa.Integer(), nullable=False),
        sa.Column("enrollment_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.ForeignKeyConstraint(["academic_year_id"], ["academic_years.id"]),
        sa.ForeignKeyConstraint(["class_section_id"], ["class_sections.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "student_education_paths",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=True),
        sa.Column("grade", sa.String(length=40), nullable=False),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("school_name", sa.String(length=255), nullable=True),
        sa.Column("curriculum_system_id", sa.Integer(), nullable=True),
        sa.Column("academic_year_label", sa.String(length=80), nullable=True),
        sa.Column("completed_status", sa.String(length=80), nullable=True),
        sa.Column("evidence_type", sa.String(length=80), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source_confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["curriculum_system_id"], ["curriculum_systems.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "uploaded_documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("case_id", sa.Integer(), nullable=True),
        sa.Column("uploaded_by_user_id", sa.Integer(), nullable=True),
        sa.Column("document_type", sa.String(length=120), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("storage_uri", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("upload_status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "document_extraction_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("processor_type", sa.String(length=120), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("raw_output_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["uploaded_documents.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "extracted_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("extraction_job_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("record_type", sa.String(length=120), nullable=False),
        sa.Column("extracted_json", postgresql.JSONB(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("review_status", sa.String(length=40), nullable=False),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_to_database", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["uploaded_documents.id"]),
        sa.ForeignKeyConstraint(["extraction_job_id"], ["document_extraction_jobs.id"]),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "agent_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("school_id", sa.Integer(), nullable=True),
        sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
        sa.Column("task_type", sa.String(length=120), nullable=False),
        sa.Column("task_prompt", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("input_json", postgresql.JSONB(), nullable=True),
        sa.Column("output_json", postgresql.JSONB(), nullable=True),
        sa.Column("requires_human_approval", sa.Boolean(), nullable=False),
        sa.Column("approved_by_user_id", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["approved_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "assessment_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("assessment_type_id", sa.Integer(), nullable=False),
        sa.Column("grade_level_target", sa.String(length=40), nullable=True),
        sa.Column("score_raw", sa.String(length=80), nullable=True),
        sa.Column("score_percent", sa.Float(), nullable=True),
        sa.Column("risk_label", sa.String(length=80), nullable=True),
        sa.Column("assessment_date", sa.Date(), nullable=True),
        sa.Column("source_document_id", sa.Integer(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["assessment_type_id"], ["assessment_types.id"]),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["source_document_id"], ["uploaded_documents.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "student_prior_grades",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("grade", sa.String(length=40), nullable=False),
        sa.Column("country", sa.String(length=120), nullable=True),
        sa.Column("school_name", sa.String(length=255), nullable=True),
        sa.Column("academic_year_label", sa.String(length=80), nullable=True),
        sa.Column("mark_raw", sa.String(length=80), nullable=True),
        sa.Column("mark_normalized", sa.Float(), nullable=True),
        sa.Column("source_document_id", sa.Integer(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["source_document_id"], ["uploaded_documents.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "analysis_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("school_id", sa.Integer(), nullable=True),
        sa.Column("analysis_type", sa.String(length=80), nullable=False),
        sa.Column("input_snapshot_json", postgresql.JSONB(), nullable=False),
        sa.Column("rule_engine_version", sa.String(length=80), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "detected_gaps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("analysis_run_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=True),
        sa.Column("gap_type", sa.String(length=120), nullable=False),
        sa.Column("severity_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=80), nullable=False),
        sa.Column("evidence_json", postgresql.JSONB(), nullable=True),
        sa.Column("explanation_text", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.ForeignKeyConstraint(["topic_id"], ["curriculum_topics.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "support_recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("analysis_run_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=True),
        sa.Column("priority_rank", sa.Integer(), nullable=True),
        sa.Column("recommendation_type", sa.String(length=120), nullable=False),
        sa.Column("reason_text", sa.Text(), nullable=False),
        sa.Column("evidence_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.ForeignKeyConstraint(["topic_id"], ["curriculum_topics.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "graph_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("analysis_run_id", sa.Integer(), nullable=False),
        sa.Column("graph_type", sa.String(length=80), nullable=False),
        sa.Column("nodes_json", postgresql.JSONB(), nullable=False),
        sa.Column("edges_json", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "model_outputs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("analysis_run_id", sa.Integer(), nullable=False),
        sa.Column("model_version_id", sa.Integer(), nullable=True),
        sa.Column("model_name", sa.String(length=160), nullable=False),
        sa.Column("output_json", postgresql.JSONB(), nullable=False),
        sa.Column("probability", sa.Float(), nullable=True),
        sa.Column("prediction_label", sa.String(length=120), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("input_features_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.ForeignKeyConstraint(["model_version_id"], ["model_versions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "fusion_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("analysis_run_id", sa.Integer(), nullable=False),
        sa.Column("fusion_version", sa.String(length=80), nullable=False),
        sa.Column("structural_gap_score", sa.Float(), nullable=True),
        sa.Column("contextual_risk_score", sa.Float(), nullable=True),
        sa.Column("assessment_risk_score", sa.Float(), nullable=True),
        sa.Column("final_support_score", sa.Float(), nullable=False),
        sa.Column("final_support_band", sa.String(length=80), nullable=False),
        sa.Column("evidence_confidence_score", sa.Float(), nullable=True),
        sa.Column("evidence_confidence_band", sa.String(length=80), nullable=True),
        sa.Column("dominant_evidence_source", sa.String(length=120), nullable=True),
        sa.Column("recommended_action", sa.Text(), nullable=True),
        sa.Column("contributions_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "teacher_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("analysis_run_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("report_title", sa.String(length=255), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("teacher_alert_text", sa.Text(), nullable=True),
        sa.Column("recommended_plan_json", postgresql.JSONB(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("generated_by_user_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["generated_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "teacher_feedback",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("report_id", sa.Integer(), nullable=True),
        sa.Column("analysis_run_id", sa.Integer(), nullable=True),
        sa.Column("teacher_user_id", sa.Integer(), nullable=False),
        sa.Column("feedback_type", sa.String(length=120), nullable=False),
        sa.Column("feedback_text", sa.Text(), nullable=False),
        sa.Column("corrected_topic_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.ForeignKeyConstraint(["corrected_topic_id"], ["curriculum_topics.id"]),
        sa.ForeignKeyConstraint(["report_id"], ["teacher_reports.id"]),
        sa.ForeignKeyConstraint(["teacher_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "intervention_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=True),
        sa.Column("analysis_run_id", sa.Integer(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("plan_json", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["analysis_run_id"], ["analysis_runs.id"]),
        sa.ForeignKeyConstraint(["case_id"], ["student_cases.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "intervention_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("intervention_plan_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=80), nullable=False),
        sa.Column("progress_note", sa.Text(), nullable=True),
        sa.Column("updated_by_user_id", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["intervention_plan_id"], ["intervention_plans.id"]),
        sa.ForeignKeyConstraint(["topic_id"], ["curriculum_topics.id"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("school_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=160), nullable=False),
        sa.Column("entity_type", sa.String(length=120), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("before_json", postgresql.JSONB(), nullable=True),
        sa.Column("after_json", postgresql.JSONB(), nullable=True),
        sa.Column("ip_address", sa.String(length=80), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("intervention_progress")
    op.drop_table("intervention_plans")
    op.drop_table("teacher_feedback")
    op.drop_table("teacher_reports")
    op.drop_table("fusion_results")
    op.drop_table("model_outputs")
    op.drop_table("graph_snapshots")
    op.drop_table("support_recommendations")
    op.drop_table("detected_gaps")
    op.drop_table("analysis_runs")
    op.drop_table("student_prior_grades")
    op.drop_table("assessment_results")
    op.drop_table("agent_tasks")
    op.drop_table("extracted_records")
    op.drop_table("document_extraction_jobs")
    op.drop_table("uploaded_documents")
    op.drop_table("student_education_paths")
    op.drop_table("enrollments")
    op.drop_table("curriculum_equivalences")
    op.drop_table("curriculum_edges")
    op.drop_table("curriculum_topics")
    op.drop_table("teacher_assignments")
    op.drop_table("student_cases")
    op.drop_table("students")
    op.drop_table("class_sections")
    op.drop_table("curriculum_import_batches")
    op.drop_table("curriculum_versions")
    op.drop_table("user_roles")
    op.drop_table("role_permissions")
    op.drop_table("academic_years")
    op.drop_table("system_events")
    op.drop_table("analytics_snapshots")
    op.drop_table("model_versions")
    op.drop_table("assessment_types")
    op.drop_table("curriculum_systems")
    op.drop_table("subjects")
    op.drop_table("permissions")
    op.drop_table("roles")
    op.drop_table("users")
    op.drop_table("schools")
