"""Student persistence operations."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db.models import Student, StudentCase, StudentEducationPath, UploadedDocument
from app.repositories.base import apply_updates, get_by_id
from app.schemas.db import StudentCreate, StudentRegistrationRequest, StudentUpdate


def create_student(db: Session, payload: StudentCreate) -> Student:
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def list_students(
    db: Session,
    school_id: int | None = None,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Student]:
    statement = select(Student).order_by(Student.id).offset(offset).limit(limit)
    if school_id is not None:
        statement = statement.where(Student.school_id == school_id)
    if q:
        pattern = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                Student.full_name.ilike(pattern),
                Student.father_name.ilike(pattern),
                Student.mother_name.ilike(pattern),
                Student.student_number.ilike(pattern),
            )
        )
    return list(db.scalars(statement))


def get_student(db: Session, student_id: int) -> Student | None:
    return get_by_id(db, Student, student_id)


def update_student(db: Session, student: Student, payload: StudentUpdate) -> Student:
    apply_updates(student, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(student)
    return student


def register_student(
    db: Session,
    payload: StudentRegistrationRequest,
    school_id: int,
    created_by_user_id: int | None = None,
) -> tuple[Student, StudentCase, list[StudentEducationPath], list[UploadedDocument]]:
    student = Student(
        school_id=school_id,
        full_name=payload.full_name,
        father_name=payload.father_name,
        mother_name=payload.mother_name,
        date_of_birth=payload.date_of_birth,
        current_grade=payload.target_grade,
        current_stream=payload.target_stream,
        student_phone=payload.student_phone,
        mother_phone=payload.mother_phone,
        father_phone=payload.father_phone,
        status="active",
    )
    db.add(student)
    db.flush()

    abroad_grades = [row.grade for row in payload.prior_education if row.country.lower() != "syria"]
    origin_country = payload.studied_country or (payload.prior_education[0].country if payload.prior_education else None)
    last_completed = max(abroad_grades, key=lambda value: int(value)) if abroad_grades else None
    case_code = f"REG-{student.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    case = StudentCase(
        student_id=student.id,
        school_id=school_id,
        case_code=case_code,
        origin_country=origin_country,
        target_country="Syria",
        target_grade=payload.target_grade,
        target_stream=payload.target_stream,
        subject_focus="Math",
        grades_studied_abroad=abroad_grades,
        last_completed_grade_abroad=last_completed,
        notes=payload.notes,
        source_type="registration",
        created_by_user_id=created_by_user_id,
        raw_input_json=payload.model_dump(mode="json"),
        status="active",
    )
    db.add(case)
    db.flush()

    paths: list[StudentEducationPath] = []
    documents: list[UploadedDocument] = []
    for row in payload.prior_education:
        path = StudentEducationPath(
            student_id=student.id,
            case_id=case.id,
            grade=row.grade,
            country=row.country,
            stream=row.stream,
            school_name=row.school_name,
            completed_status="completed",
            evidence_type="report_card" if row.original_filename else None,
            source_confidence=0.65 if row.original_filename else None,
        )
        db.add(path)
        paths.append(path)

        if row.original_filename:
            document = UploadedDocument(
                school_id=school_id,
                student_id=student.id,
                case_id=case.id,
                uploaded_by_user_id=created_by_user_id,
                document_type=row.document_type or "previous_grade_report_card",
                original_filename=row.original_filename,
                storage_uri=f"local-mvp://pending-upload/{student.id}/{row.grade}/{row.original_filename}",
                mime_type=row.mime_type,
                upload_status="metadata_only",
                metadata_json={
                    "grade": row.grade,
                    "country": row.country,
                    "stream": row.stream,
                    "school_name": row.school_name,
                    "note": "Local MVP stores report-card metadata only; binary file storage is a later step.",
                },
            )
            db.add(document)
            documents.append(document)

    db.commit()
    db.refresh(student)
    db.refresh(case)
    for path in paths:
        db.refresh(path)
    for document in documents:
        db.refresh(document)
    return student, case, paths, documents


def get_student_profile(db: Session, student_id: int) -> tuple[Student | None, list[StudentCase], list[StudentEducationPath], list[UploadedDocument]]:
    student = get_student(db, student_id)
    if student is None:
        return None, [], [], []
    cases = list(db.scalars(select(StudentCase).where(StudentCase.student_id == student_id).order_by(StudentCase.id.desc())))
    paths = list(
        db.scalars(
            select(StudentEducationPath)
            .where(StudentEducationPath.student_id == student_id)
            .order_by(StudentEducationPath.grade.desc(), StudentEducationPath.id)
        )
    )
    documents = list(
        db.scalars(select(UploadedDocument).where(UploadedDocument.student_id == student_id).order_by(UploadedDocument.id.desc()))
    )
    return student, cases, paths, documents

