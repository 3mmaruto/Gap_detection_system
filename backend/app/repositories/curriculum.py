"""Curriculum persistence operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import CurriculumEdge, CurriculumSystem, CurriculumTopic, CurriculumVersion, Subject


def get_or_create_subject(db: Session, code: str, name_en: str | None = None, name_native: str | None = None) -> Subject:
    subject = db.scalar(select(Subject).where(Subject.code == code))
    if subject:
        return subject
    subject = Subject(code=code, name_en=name_en or code, name_native=name_native)
    db.add(subject)
    db.flush()
    return subject


def get_or_create_curriculum_system(db: Session, country: str, name: str | None = None) -> CurriculumSystem:
    system_name = name or f"{country} Curriculum"
    system = db.scalar(select(CurriculumSystem).where(CurriculumSystem.name == system_name))
    if system:
        return system
    system = CurriculumSystem(name=system_name, country=country, language=None, status="active")
    db.add(system)
    db.flush()
    return system


def get_or_create_curriculum_version(db: Session, system_id: int, version_name: str = "prototype") -> CurriculumVersion:
    version = db.scalar(
        select(CurriculumVersion).where(
            CurriculumVersion.curriculum_system_id == system_id,
            CurriculumVersion.version_name == version_name,
        )
    )
    if version:
        return version
    version = CurriculumVersion(curriculum_system_id=system_id, version_name=version_name, is_active=True)
    db.add(version)
    db.flush()
    return version


def list_topics(
    db: Session,
    country: str | None = None,
    grade: str | None = None,
    stream: str | None = None,
    subject_id: int | None = None,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[CurriculumTopic]:
    statement = select(CurriculumTopic).order_by(CurriculumTopic.id).offset(offset).limit(limit)
    if country:
        statement = statement.where(CurriculumTopic.country == country)
    if grade:
        statement = statement.where(CurriculumTopic.grade == grade)
    if stream:
        statement = statement.where(CurriculumTopic.stream == stream)
    if subject_id:
        statement = statement.where(CurriculumTopic.subject_id == subject_id)
    if q:
        pattern = f"%{q}%"
        statement = statement.where(
            CurriculumTopic.topic_name_en.ilike(pattern) | CurriculumTopic.topic_name_native.ilike(pattern)
        )
    return list(db.scalars(statement))


def list_edges(db: Session, relation_type: str | None = None, limit: int = 100, offset: int = 0) -> list[CurriculumEdge]:
    statement = select(CurriculumEdge).order_by(CurriculumEdge.id).offset(offset).limit(limit)
    if relation_type:
        statement = statement.where(CurriculumEdge.relation_type == relation_type)
    return list(db.scalars(statement))

