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
    student_phone: str | None = None
    mother_phone: str | None = None
    father_phone: str | None = None
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
    student_phone: str | None = None
    mother_phone: str | None = None
    father_phone: str | None = None
    current_section_id: int | None = None
    status: str | None = None


class StudentRead(ORMModel, StudentCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class PriorEducationPathInput(BaseModel):
    grade: str
    country: str
    stream: str | None = None
    school_name: str | None = None
    document_type: str | None = None
    original_filename: str | None = None
    mime_type: str | None = None


class StudentRegistrationRequest(BaseModel):
    school_id: int | None = None
    full_name: str
    mother_name: str
    father_name: str
    date_of_birth: date
    target_grade: str
    target_stream: str
    student_phone: str | None = None
    mother_phone: str | None = None
    father_phone: str | None = None
    studied_outside_syria: bool = False
    studied_country: str | None = None
    prior_education: list[PriorEducationPathInput] = Field(default_factory=list)
    notes: str | None = None


class StudentEducationPathRead(ORMModel):
    id: int
    student_id: int
    case_id: int | None
    grade: str
    country: str
    stream: str | None
    school_name: str | None
    evidence_type: str | None
    notes: str | None
    created_at: datetime


class UploadedDocumentRead(ORMModel):
    id: int
    school_id: int
    student_id: int | None
    case_id: int | None
    document_type: str | None
    original_filename: str
    storage_uri: str
    mime_type: str | None
    upload_status: str
    created_at: datetime
    metadata_json: dict[str, Any] | None


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


class StudentRegistrationResponse(BaseModel):
    student: StudentRead
    case: StudentCaseRead
    education_paths: list[StudentEducationPathRead]
    documents: list[UploadedDocumentRead]


class StudentProfileRead(BaseModel):
    student: StudentRead
    cases: list[StudentCaseRead]
    education_paths: list[StudentEducationPathRead]
    documents: list[UploadedDocumentRead]


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


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserRead(BaseModel):
    id: int
    full_name: str
    email: str | None
    roles: list[str]
    school_id: int | None = None
    school_name: str | None = None


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "teacher"
    school_id: int | None = None
    status: str = "active"


class UserRead(ORMModel):
    id: int
    full_name: str
    email: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    roles: list[str] = Field(default_factory=list)
    school_id: int | None = None
    school_name: str | None = None


class BootstrapDemoResponse(BaseModel):
    school_id: int
    user_id: int
    email: str
    role: str


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
