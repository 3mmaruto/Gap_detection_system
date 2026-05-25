"""Core PostgreSQL schema models for KGDS and school decision support."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base

JSONBType = JSON().with_variant(postgresql.JSONB(), "postgresql")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class School(Base, TimestampMixin):
    __tablename__ = "schools"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(80), unique=True)
    type: Mapped[str | None] = mapped_column(String(80))
    country: Mapped[str | None] = mapped_column(String(120))
    city: Mapped[str | None] = mapped_column(String(120))
    region: Mapped[str | None] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="active")


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    school_id: Mapped[int | None] = mapped_column(ForeignKey("schools.id"))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(80))
    password_hash: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(40), default="active")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", "school_id", name="uq_user_role_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    school_id: Mapped[int | None] = mapped_column(ForeignKey("schools.id"))
    ministry_scope: Mapped[str | None] = mapped_column(String(160))


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id"), nullable=False)


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(160))
    name_native: Mapped[str | None] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)


class Student(Base, TimestampMixin):
    __tablename__ = "students"
    __table_args__ = (UniqueConstraint("school_id", "student_number", name="uq_school_student_number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    student_number: Mapped[str | None] = mapped_column(String(80))
    first_name: Mapped[str | None] = mapped_column(String(120))
    father_name: Mapped[str | None] = mapped_column(String(120))
    mother_name: Mapped[str | None] = mapped_column(String(120))
    last_name: Mapped[str | None] = mapped_column(String(120))
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(40))
    nationality: Mapped[str | None] = mapped_column(String(120))
    current_grade: Mapped[str | None] = mapped_column(String(40))
    current_stream: Mapped[str | None] = mapped_column(String(80))
    current_section_id: Mapped[int | None] = mapped_column(ForeignKey("class_sections.id"))
    status: Mapped[str] = mapped_column(String(40), default="active")


class ClassSection(Base):
    __tablename__ = "class_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    academic_year_id: Mapped[int] = mapped_column(ForeignKey("academic_years.id"), nullable=False)
    grade: Mapped[str] = mapped_column(String(40), nullable=False)
    stream: Mapped[str | None] = mapped_column(String(80))
    section_name: Mapped[str] = mapped_column(String(80), nullable=False)
    homeroom_teacher_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(40), default="active")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    class_section_id: Mapped[int] = mapped_column(ForeignKey("class_sections.id"), nullable=False)
    academic_year_id: Mapped[int] = mapped_column(ForeignKey("academic_years.id"), nullable=False)
    enrollment_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(40), default="active")


class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    teacher_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    class_section_id: Mapped[int] = mapped_column(ForeignKey("class_sections.id"), nullable=False)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id"))
    academic_year_id: Mapped[int] = mapped_column(ForeignKey("academic_years.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active")


class CurriculumSystem(Base):
    __tablename__ = "curriculum_systems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    language: Mapped[str | None] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="active")


class CurriculumVersion(Base):
    __tablename__ = "curriculum_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    curriculum_system_id: Mapped[int] = mapped_column(ForeignKey("curriculum_systems.id"), nullable=False)
    version_name: Mapped[str] = mapped_column(String(160), nullable=False)
    year_from: Mapped[int | None] = mapped_column(Integer)
    year_to: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class CurriculumTopic(Base, TimestampMixin):
    __tablename__ = "curriculum_topics"
    __table_args__ = (UniqueConstraint("external_topic_id", name="uq_curriculum_topic_external"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_topic_id: Mapped[str | None] = mapped_column(String(160))
    curriculum_system_id: Mapped[int] = mapped_column(ForeignKey("curriculum_systems.id"), nullable=False)
    curriculum_version_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_versions.id"))
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    grade: Mapped[str] = mapped_column(String(40), nullable=False)
    stream: Mapped[str | None] = mapped_column(String(80))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    subject_branch: Mapped[str | None] = mapped_column(String(160))
    unit_name_native: Mapped[str | None] = mapped_column(String(255))
    unit_name_en: Mapped[str | None] = mapped_column(String(255))
    topic_name_native: Mapped[str] = mapped_column(String(255), nullable=False)
    topic_name_en: Mapped[str | None] = mapped_column(String(255))
    topic_order: Mapped[float | None] = mapped_column(Float)
    is_core_topic: Mapped[bool] = mapped_column(Boolean, default=True)
    difficulty_level: Mapped[str | None] = mapped_column(String(80))
    metadata_json: Mapped[dict | None] = mapped_column(JSONBType)


class CurriculumEdge(Base):
    __tablename__ = "curriculum_edges"
    __table_args__ = (UniqueConstraint("source_topic_id", "target_topic_id", "relation_type", name="uq_curriculum_edge"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_topic_id: Mapped[int] = mapped_column(ForeignKey("curriculum_topics.id"), nullable=False)
    target_topic_id: Mapped[int] = mapped_column(ForeignKey("curriculum_topics.id"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(80), nullable=False)
    weight: Mapped[float | None] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column(JSONBType)


class CurriculumEquivalence(Base):
    __tablename__ = "curriculum_equivalences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id_a: Mapped[int] = mapped_column(ForeignKey("curriculum_topics.id"), nullable=False)
    topic_id_b: Mapped[int] = mapped_column(ForeignKey("curriculum_topics.id"), nullable=False)
    equivalence_type: Mapped[str] = mapped_column(String(80), nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(160))


class CurriculumImportBatch(Base):
    __tablename__ = "curriculum_import_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_type: Mapped[str] = mapped_column(String(80), nullable=False)
    source_uri: Mapped[str | None] = mapped_column(Text)
    imported_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(40), default="completed")
    summary_json: Mapped[dict | None] = mapped_column(JSONBType)


class StudentEducationPath(Base):
    __tablename__ = "student_education_paths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    case_id: Mapped[int | None] = mapped_column(ForeignKey("student_cases.id"))
    grade: Mapped[str] = mapped_column(String(40), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str | None] = mapped_column(String(120))
    school_name: Mapped[str | None] = mapped_column(String(255))
    curriculum_system_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_systems.id"))
    academic_year_label: Mapped[str | None] = mapped_column(String(80))
    completed_status: Mapped[str | None] = mapped_column(String(80))
    evidence_type: Mapped[str | None] = mapped_column(String(80))
    notes: Mapped[str | None] = mapped_column(Text)
    source_confidence: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StudentCase(Base, TimestampMixin):
    __tablename__ = "student_cases"
    __table_args__ = (UniqueConstraint("case_code", name="uq_student_case_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    school_id: Mapped[int | None] = mapped_column(ForeignKey("schools.id"))
    case_code: Mapped[str] = mapped_column(String(120), nullable=False)
    origin_country: Mapped[str | None] = mapped_column(String(120))
    target_country: Mapped[str] = mapped_column(String(120), default="Syria")
    target_grade: Mapped[str] = mapped_column(String(40), nullable=False)
    target_stream: Mapped[str | None] = mapped_column(String(80))
    subject_focus: Mapped[str] = mapped_column(String(120), default="Math")
    grades_studied_abroad: Mapped[dict | list | None] = mapped_column(JSONBType)
    last_completed_grade_abroad: Mapped[str | None] = mapped_column(String(40))
    overall_difficulty: Mapped[float | None] = mapped_column(Float)
    math_difficulty: Mapped[float | None] = mapped_column(Float)
    reading_difficulty: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    raw_input_json: Mapped[dict | None] = mapped_column(JSONBType)
    source_type: Mapped[str] = mapped_column(String(80), default="manual_test")
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(40), default="active")


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("schools.id"), nullable=False)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    case_id: Mapped[int | None] = mapped_column(ForeignKey("student_cases.id"))
    uploaded_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    document_type: Mapped[str | None] = mapped_column(String(120))
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(120))
    file_size: Mapped[int | None] = mapped_column(Integer)
    upload_status: Mapped[str] = mapped_column(String(40), default="uploaded")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    metadata_json: Mapped[dict | None] = mapped_column(JSONBType)


class DocumentExtractionJob(Base):
    __tablename__ = "document_extraction_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id"), nullable=False)
    requested_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(40), default="queued")
    processor_type: Mapped[str | None] = mapped_column(String(120))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)
    raw_output_json: Mapped[dict | None] = mapped_column(JSONBType)


class ExtractedRecord(Base):
    __tablename__ = "extracted_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    extraction_job_id: Mapped[int] = mapped_column(ForeignKey("document_extraction_jobs.id"), nullable=False)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id"), nullable=False)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    record_type: Mapped[str] = mapped_column(String(120), nullable=False)
    extracted_json: Mapped[dict] = mapped_column(JSONBType, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float)
    review_status: Mapped[str] = mapped_column(String(40), default="pending_review")
    reviewed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    applied_to_database: Mapped[bool] = mapped_column(Boolean, default=False)


class AgentTask(Base, TimestampMixin):
    __tablename__ = "agent_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    school_id: Mapped[int | None] = mapped_column(ForeignKey("schools.id"))
    requested_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    task_type: Mapped[str] = mapped_column(String(120), nullable=False)
    task_prompt: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="queued")
    input_json: Mapped[dict | None] = mapped_column(JSONBType)
    output_json: Mapped[dict | None] = mapped_column(JSONBType)
    requires_human_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AssessmentType(Base):
    __tablename__ = "assessment_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    case_id: Mapped[int | None] = mapped_column(ForeignKey("student_cases.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    assessment_type_id: Mapped[int] = mapped_column(ForeignKey("assessment_types.id"), nullable=False)
    grade_level_target: Mapped[str | None] = mapped_column(String(40))
    score_raw: Mapped[str | None] = mapped_column(String(80))
    score_percent: Mapped[float | None] = mapped_column(Float)
    risk_label: Mapped[str | None] = mapped_column(String(80))
    assessment_date: Mapped[date | None] = mapped_column(Date)
    source_document_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_documents.id"))
    metadata_json: Mapped[dict | None] = mapped_column(JSONBType)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class StudentPriorGrade(Base):
    __tablename__ = "student_prior_grades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    case_id: Mapped[int | None] = mapped_column(ForeignKey("student_cases.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    grade: Mapped[str] = mapped_column(String(40), nullable=False)
    country: Mapped[str | None] = mapped_column(String(120))
    school_name: Mapped[str | None] = mapped_column(String(255))
    academic_year_label: Mapped[str | None] = mapped_column(String(80))
    mark_raw: Mapped[str | None] = mapped_column(String(80))
    mark_normalized: Mapped[float | None] = mapped_column(Float)
    source_document_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_documents.id"))
    confidence_score: Mapped[float | None] = mapped_column(Float)
    metadata_json: Mapped[dict | None] = mapped_column(JSONBType)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("student_cases.id"), nullable=False)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    school_id: Mapped[int | None] = mapped_column(ForeignKey("schools.id"))
    analysis_type: Mapped[str] = mapped_column(String(80), default="rule_based_gap_detection")
    input_snapshot_json: Mapped[dict] = mapped_column(JSONBType, nullable=False)
    rule_engine_version: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    error_message: Mapped[str | None] = mapped_column(Text)


class DetectedGap(Base):
    __tablename__ = "detected_gaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), nullable=False)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_topics.id"))
    gap_type: Mapped[str] = mapped_column(String(120), nullable=False)
    severity_score: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(80), default="open")
    evidence_json: Mapped[dict | None] = mapped_column(JSONBType)
    explanation_text: Mapped[str | None] = mapped_column(Text)


class SupportRecommendation(Base):
    __tablename__ = "support_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), nullable=False)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_topics.id"))
    priority_rank: Mapped[int | None] = mapped_column(Integer)
    recommendation_type: Mapped[str] = mapped_column(String(120), default="support_first_topic")
    reason_text: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_json: Mapped[dict | None] = mapped_column(JSONBType)


class GraphSnapshot(Base):
    __tablename__ = "graph_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), nullable=False)
    graph_type: Mapped[str] = mapped_column(String(80), nullable=False)
    nodes_json: Mapped[list | dict] = mapped_column(JSONBType, nullable=False)
    edges_json: Mapped[list | dict] = mapped_column(JSONBType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_name: Mapped[str] = mapped_column(String(160), nullable=False)
    version: Mapped[str] = mapped_column(String(80), nullable=False)
    task: Mapped[str] = mapped_column(String(160), nullable=False)
    artifact_uri: Mapped[str | None] = mapped_column(Text)
    training_dataset: Mapped[str | None] = mapped_column(String(255))
    metrics_json: Mapped[dict | None] = mapped_column(JSONBType)
    feature_schema_json: Mapped[dict | None] = mapped_column(JSONBType)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ModelOutput(Base):
    __tablename__ = "model_outputs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), nullable=False)
    model_version_id: Mapped[int | None] = mapped_column(ForeignKey("model_versions.id"))
    model_name: Mapped[str] = mapped_column(String(160), nullable=False)
    output_json: Mapped[dict] = mapped_column(JSONBType, nullable=False)
    probability: Mapped[float | None] = mapped_column(Float)
    prediction_label: Mapped[str | None] = mapped_column(String(120))
    confidence_score: Mapped[float | None] = mapped_column(Float)
    input_features_json: Mapped[dict | None] = mapped_column(JSONBType)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FusionResult(Base):
    __tablename__ = "fusion_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), nullable=False)
    fusion_version: Mapped[str] = mapped_column(String(80), nullable=False)
    structural_gap_score: Mapped[float | None] = mapped_column(Float)
    contextual_risk_score: Mapped[float | None] = mapped_column(Float)
    assessment_risk_score: Mapped[float | None] = mapped_column(Float)
    final_support_score: Mapped[float] = mapped_column(Float, nullable=False)
    final_support_band: Mapped[str] = mapped_column(String(80), nullable=False)
    evidence_confidence_score: Mapped[float | None] = mapped_column(Float)
    evidence_confidence_band: Mapped[str | None] = mapped_column(String(80))
    dominant_evidence_source: Mapped[str | None] = mapped_column(String(120))
    recommended_action: Mapped[str | None] = mapped_column(Text)
    contributions_json: Mapped[dict | None] = mapped_column(JSONBType)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TeacherReport(Base):
    __tablename__ = "teacher_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"), nullable=False)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"))
    case_id: Mapped[int] = mapped_column(ForeignKey("student_cases.id"), nullable=False)
    report_title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    teacher_alert_text: Mapped[str | None] = mapped_column(Text)
    recommended_plan_json: Mapped[dict | None] = mapped_column(JSONBType)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    generated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class TeacherFeedback(Base):
    __tablename__ = "teacher_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[int | None] = mapped_column(ForeignKey("teacher_reports.id"))
    analysis_run_id: Mapped[int | None] = mapped_column(ForeignKey("analysis_runs.id"))
    teacher_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    feedback_type: Mapped[str] = mapped_column(String(120), nullable=False)
    feedback_text: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_topic_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_topics.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class InterventionPlan(Base):
    __tablename__ = "intervention_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    case_id: Mapped[int | None] = mapped_column(ForeignKey("student_cases.id"))
    analysis_run_id: Mapped[int | None] = mapped_column(ForeignKey("analysis_runs.id"))
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="draft")
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    plan_json: Mapped[dict | None] = mapped_column(JSONBType)


class InterventionProgress(Base):
    __tablename__ = "intervention_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    intervention_plan_id: Mapped[int] = mapped_column(ForeignKey("intervention_plans.id"), nullable=False)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_topics.id"))
    status: Mapped[str] = mapped_column(String(80), nullable=False)
    progress_note: Mapped[str | None] = mapped_column(Text)
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    snapshot_type: Mapped[str] = mapped_column(String(120), nullable=False)
    scope_type: Mapped[str | None] = mapped_column(String(120))
    scope_id: Mapped[int | None] = mapped_column(Integer)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    metrics_json: Mapped[dict] = mapped_column(JSONBType, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    school_id: Mapped[int | None] = mapped_column(ForeignKey("schools.id"))
    action: Mapped[str] = mapped_column(String(160), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(120))
    entity_id: Mapped[int | None] = mapped_column(Integer)
    before_json: Mapped[dict | None] = mapped_column(JSONBType)
    after_json: Mapped[dict | None] = mapped_column(JSONBType)
    ip_address: Mapped[str | None] = mapped_column(String(80))
    user_agent: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SystemEvent(Base):
    __tablename__ = "system_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[str] = mapped_column(String(40), default="info")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSONBType)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
