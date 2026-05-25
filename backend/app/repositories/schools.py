"""School persistence operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import School
from app.repositories.base import apply_updates, get_by_id
from app.schemas.db import SchoolCreate, SchoolUpdate


def create_school(db: Session, payload: SchoolCreate) -> School:
    school = School(**payload.model_dump())
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


def list_schools(db: Session, limit: int = 100, offset: int = 0) -> list[School]:
    return list(db.scalars(select(School).order_by(School.id).offset(offset).limit(limit)))


def get_school(db: Session, school_id: int) -> School | None:
    return get_by_id(db, School, school_id)


def update_school(db: Session, school: School, payload: SchoolUpdate) -> School:
    apply_updates(school, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(school)
    return school

