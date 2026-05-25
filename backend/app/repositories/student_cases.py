"""Student case persistence operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import StudentCase
from app.repositories.base import get_by_id
from app.schemas.db import StudentCaseCreate


def create_student_case(db: Session, payload: StudentCaseCreate) -> StudentCase:
    case = StudentCase(**payload.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def upsert_student_case(db: Session, payload: StudentCaseCreate) -> StudentCase:
    existing = db.scalar(select(StudentCase).where(StudentCase.case_code == payload.case_code))
    if existing:
        values = payload.model_dump(exclude_unset=True)
        for key, value in values.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    return create_student_case(db, payload)


def list_student_cases(db: Session, source_type: str | None = None, limit: int = 100, offset: int = 0) -> list[StudentCase]:
    statement = select(StudentCase).order_by(StudentCase.id).offset(offset).limit(limit)
    if source_type:
        statement = statement.where(StudentCase.source_type == source_type)
    return list(db.scalars(statement))


def get_student_case(db: Session, case_id: int) -> StudentCase | None:
    return get_by_id(db, StudentCase, case_id)

