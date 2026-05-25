"""Student persistence operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Student
from app.repositories.base import apply_updates, get_by_id
from app.schemas.db import StudentCreate, StudentUpdate


def create_student(db: Session, payload: StudentCreate) -> Student:
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def list_students(db: Session, school_id: int | None = None, limit: int = 100, offset: int = 0) -> list[Student]:
    statement = select(Student).order_by(Student.id).offset(offset).limit(limit)
    if school_id is not None:
        statement = statement.where(Student.school_id == school_id)
    return list(db.scalars(statement))


def get_student(db: Session, student_id: int) -> Student | None:
    return get_by_id(db, Student, student_id)


def update_student(db: Session, student: Student, payload: StudentUpdate) -> Student:
    apply_updates(student, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(student)
    return student

