"""Database-backed API schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SchoolCreate(BaseModel):
    name: str
    code: str | None = None
    type: str | None = None
    country: str | None = None
    city: str | None = None
    region: str | None = None
    address: str | None = None
    status: str = "active"


class SchoolUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    type: str | None = None
    country: str | None = None
    city: str | None = None
    region: str | None = None
    address: str | None = None
    status: str | None = None


class SchoolRead(ORMModel, SchoolCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class StudentCreate(BaseModel):
    school_id: int
    student_number: str | None = None
    first_name: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    last_name: str | None = None
    full_name: str
    date_of_birth: date | None = None
    gender: str | None = None
    nationality: str | None = None
    current_grade: str | None = None
    current_stream: str | None = None
    current_section_id: int | None = None
    status: str = "active"


class StudentUpdate(BaseModel):
    student_number: str | None = None
    first_name: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    last_name: str | None = None
    full_name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    nationality: str | None = None
    current_grade: str | None = None
    current_stream: str | None = None
    current_section_id: int | None = None
    status: str | None = None


class StudentRead(ORMModel, StudentCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class StudentCaseCreate(BaseModel):
    student_id: int | None = None
    school_id: int | None = None
    case_code: str
    origin_country: str | None = None
    target_country: str = "Syria"
    target_grade: str
    target_stream: str | None = None
    subject_focus: str = "Math"
    grades_studied_abroad: list[str] | dict[str, Any] | None = None
    last_completed_grade_abroad: str | None = None
    overall_difficulty: float | None = None
    math_difficulty: float | None = None
    reading_difficulty: float | None = None
    notes: str | None = None
    raw_input_json: dict[str, Any] | None = None
    source_type: str = "manual_test"
    created_by_user_id: int | None = None
    status: str = "active"


class StudentCaseRead(ORMModel, StudentCaseCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class CurriculumTopicRead(ORMModel):
    id: int
    external_topic_id: str | None
    country: str
    grade: str
    stream: str | None
    subject_id: int
    subject_branch: str | None
    topic_name_native: str
    topic_name_en: str | None
    topic_order: float | None
    is_core_topic: bool


class CurriculumEdgeRead(ORMModel):
    id: int
    source_topic_id: int
    target_topic_id: int
    relation_type: str
    weight: float | None
    description: str | None
    metadata_json: dict[str, Any] | None


class CurriculumImportRequest(BaseModel):
    source_type: str = Field(default="google_sheet")
    source_uri: str | None = None
    import_topics: bool = True
    import_edges: bool = True
    import_student_cases: bool = True


class CurriculumImportResponse(BaseModel):
    batch_id: int | None
    status: str
    summary: dict[str, Any]


class RoleSeedResponse(BaseModel):
    roles_created: int
    permissions_created: int
    role_permissions_created: int


class AnalysisRunRead(ORMModel):
    id: int
    case_id: int
    student_id: int | None
    school_id: int | None
    analysis_type: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    error_message: str | None


class DetectedGapRead(ORMModel):
    id: int
    analysis_run_id: int
    topic_id: int | None
    gap_type: str
    severity_score: float | None
    status: str
    evidence_json: dict[str, Any] | None
    explanation_text: str | None


class SupportRecommendationRead(ORMModel):
    id: int
    analysis_run_id: int
    topic_id: int | None
    priority_rank: int | None
    recommendation_type: str
    reason_text: str
    evidence_json: dict[str, Any] | None
