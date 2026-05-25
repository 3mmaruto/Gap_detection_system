"""Import current Google Sheet/CSV curriculum data into PostgreSQL."""

from __future__ import annotations

from typing import Any

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import CurriculumEdge, CurriculumImportBatch, CurriculumTopic, StudentCase
from app.logic.config import settings
from app.repositories.curriculum import get_or_create_curriculum_system, get_or_create_curriculum_version, get_or_create_subject


def _sheet_csv_url(gid: int) -> str:
    return f"https://docs.google.com/spreadsheets/d/{settings.spreadsheet_id}/gviz/tq?tqx=out:csv&gid={gid}"


def _read_source(local_path: str | None, gid: int) -> pd.DataFrame:
    return pd.read_csv(local_path or _sheet_csv_url(gid))


def _none_if_nan(value: Any) -> Any:
    if pd.isna(value):
        return None
    return value


def _string_or_none(value: Any) -> str | None:
    value = _none_if_nan(value)
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _float_or_none(value: Any) -> float | None:
    value = _none_if_nan(value)
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _bool_from_sheet(value: Any) -> bool:
    value = _none_if_nan(value)
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def import_current_sources(
    db: Session,
    source_type: str = "google_sheet",
    source_uri: str | None = None,
    import_topics: bool = True,
    import_edges: bool = True,
    import_student_cases: bool = True,
) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "topics_upserted": 0,
        "edges_upserted": 0,
        "student_cases_upserted": 0,
        "edges_skipped_missing_topics": 0,
    }

    batch = CurriculumImportBatch(
        source_type=source_type,
        source_uri=source_uri or f"google_sheet:{settings.spreadsheet_id}",
        status="running",
        summary_json={},
    )
    db.add(batch)
    db.flush()

    topic_lookup: dict[str, CurriculumTopic] = {}

    if import_topics:
        topics_df = _read_source(settings.topics_csv, settings.topics_gid)
        for _, row in topics_df.iterrows():
            external_topic_id = _string_or_none(row.get("topic_id"))
            if not external_topic_id:
                continue

            country = _string_or_none(row.get("country")) or "Unknown"
            subject_code = _string_or_none(row.get("subject")) or "Unknown"
            subject = get_or_create_subject(db, code=subject_code, name_en=subject_code)
            system = get_or_create_curriculum_system(db, country=country)
            version = get_or_create_curriculum_version(db, system.id, "prototype")

            topic = db.scalar(select(CurriculumTopic).where(CurriculumTopic.external_topic_id == external_topic_id))
            values = {
                "external_topic_id": external_topic_id,
                "curriculum_system_id": system.id,
                "curriculum_version_id": version.id,
                "country": country,
                "grade": _string_or_none(row.get("grade")) or "",
                "stream": _string_or_none(row.get("stream")),
                "subject_id": subject.id,
                "subject_branch": _string_or_none(row.get("subject_branch")),
                "unit_name_native": _string_or_none(row.get("unit_name_native")),
                "unit_name_en": _string_or_none(row.get("unit_name_en")),
                "topic_name_native": _string_or_none(row.get("topic_name_native"))
                or _string_or_none(row.get("topic_name_en"))
                or external_topic_id,
                "topic_name_en": _string_or_none(row.get("topic_name_en")),
                "topic_order": _float_or_none(row.get("topic_order")),
                "is_core_topic": _bool_from_sheet(row.get("is_core_topic")),
                "difficulty_level": _string_or_none(row.get("difficulty_level")),
                "metadata_json": {
                    "source": "prototype_google_sheet",
                    "raw": {k: _none_if_nan(v) for k, v in row.to_dict().items()},
                },
            }
            if topic:
                for key, value in values.items():
                    setattr(topic, key, value)
            else:
                topic = CurriculumTopic(**values)
                db.add(topic)
            db.flush()
            topic_lookup[external_topic_id] = topic
            summary["topics_upserted"] += 1

    if import_edges:
        if not topic_lookup:
            topic_lookup = {
                topic.external_topic_id: topic
                for topic in db.scalars(select(CurriculumTopic).where(CurriculumTopic.external_topic_id.is_not(None)))
            }
        prereq_df = _read_source(settings.prereq_csv, settings.prereq_gid)
        for _, row in prereq_df.iterrows():
            source_external = _string_or_none(row.get("from_topic_id"))
            target_external = _string_or_none(row.get("to_topic_id"))
            source_topic = topic_lookup.get(source_external or "")
            target_topic = topic_lookup.get(target_external or "")
            if not source_topic or not target_topic:
                summary["edges_skipped_missing_topics"] += 1
                continue

            relation_type = _string_or_none(row.get("relation_type")) or "prerequisite"
            edge = db.scalar(
                select(CurriculumEdge).where(
                    CurriculumEdge.source_topic_id == source_topic.id,
                    CurriculumEdge.target_topic_id == target_topic.id,
                    CurriculumEdge.relation_type == relation_type,
                )
            )
            values = {
                "source_topic_id": source_topic.id,
                "target_topic_id": target_topic.id,
                "relation_type": relation_type,
                "weight": _float_or_none(row.get("weight")),
                "description": _string_or_none(row.get("description")),
                "metadata_json": {
                    "edge_id": _string_or_none(row.get("edge_id")),
                    "strength": _string_or_none(row.get("strength")),
                    "is_cross_grade": _bool_from_sheet(row.get("is_cross_grade")),
                    "is_cross_country": _bool_from_sheet(row.get("is_cross_country")),
                    "curation_status": _string_or_none(row.get("curation_status")),
                    "raw": {k: _none_if_nan(v) for k, v in row.to_dict().items()},
                },
            }
            if edge:
                for key, value in values.items():
                    setattr(edge, key, value)
            else:
                db.add(CurriculumEdge(**values))
            summary["edges_upserted"] += 1

    if import_student_cases:
        cases_df = _read_source(settings.student_cases_csv, settings.student_cases_gid)
        for _, row in cases_df.iterrows():
            case_code = _string_or_none(row.get("case_id")) or _string_or_none(row.get("case_code"))
            if not case_code:
                continue
            case = db.scalar(select(StudentCase).where(StudentCase.case_code == case_code))
            grades = _string_or_none(row.get("grades_studied_abroad"))
            values = {
                "case_code": case_code,
                "origin_country": _string_or_none(row.get("origin_country")),
                "target_country": _string_or_none(row.get("target_country")) or "Syria",
                "target_grade": _string_or_none(row.get("target_grade")) or "",
                "target_stream": _string_or_none(row.get("target_stream")),
                "subject_focus": _string_or_none(row.get("subject_focus")) or "Math",
                "grades_studied_abroad": [item.strip() for item in grades.split(",")] if grades else None,
                "last_completed_grade_abroad": _string_or_none(row.get("last_completed_grade_abroad")),
                "overall_difficulty": _float_or_none(row.get("overall_difficulty")),
                "math_difficulty": _float_or_none(row.get("math_difficulty")),
                "notes": _string_or_none(row.get("notes")),
                "raw_input_json": {k: _none_if_nan(v) for k, v in row.to_dict().items()},
                "source_type": "prototype",
                "status": "active",
            }
            if case:
                for key, value in values.items():
                    setattr(case, key, value)
            else:
                db.add(StudentCase(**values))
            summary["student_cases_upserted"] += 1

    batch.status = "completed"
    batch.summary_json = summary
    db.commit()
    db.refresh(batch)
    summary["batch_id"] = batch.id
    return summary

