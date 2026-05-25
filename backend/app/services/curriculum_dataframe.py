"""Load PostgreSQL curriculum data into DataFrames expected by the rule engine."""

from __future__ import annotations

import pandas as pd
from sqlalchemy import select

from app.db.models import CurriculumEdge, CurriculumTopic, StudentCase, Subject
from app.db.session import SessionLocal, is_database_configured


def load_curriculum_dataframes_from_db() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if not is_database_configured() or SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")

    with SessionLocal() as db:
        topic_rows = []
        topics = db.execute(select(CurriculumTopic, Subject).join(Subject, CurriculumTopic.subject_id == Subject.id)).all()
        for topic, subject in topics:
            topic_rows.append(
                {
                    "topic_id": topic.external_topic_id or str(topic.id),
                    "country": topic.country,
                    "grade": topic.grade,
                    "stream": topic.stream,
                    "subject": subject.code,
                    "subject_branch": topic.subject_branch,
                    "unit_name_native": topic.unit_name_native,
                    "unit_name_en": topic.unit_name_en,
                    "topic_name_native": topic.topic_name_native,
                    "topic_name_en": topic.topic_name_en,
                    "topic_order": topic.topic_order,
                    "is_core_topic": 1 if topic.is_core_topic else 0,
                }
            )

        topic_by_id = {topic.id: topic for topic, _subject in topics}
        edge_rows = []
        for edge in db.scalars(select(CurriculumEdge)):
            source = topic_by_id.get(edge.source_topic_id)
            target = topic_by_id.get(edge.target_topic_id)
            if not source or not target:
                continue
            metadata = edge.metadata_json or {}
            edge_rows.append(
                {
                    "edge_id": metadata.get("edge_id") or str(edge.id),
                    "from_topic_id": source.external_topic_id or str(source.id),
                    "to_topic_id": target.external_topic_id or str(target.id),
                    "relation_type": edge.relation_type,
                    "strength": metadata.get("strength") or "required",
                    "is_cross_grade": int(metadata.get("is_cross_grade", source.grade != target.grade)),
                    "is_cross_country": int(metadata.get("is_cross_country", source.country != target.country)),
                    "curation_status": metadata.get("curation_status") or "imported",
                }
            )

        case_rows = []
        for case in db.scalars(select(StudentCase)):
            grades = case.grades_studied_abroad
            if isinstance(grades, list):
                grades_value = ", ".join(map(str, grades))
            else:
                grades_value = grades
            case_rows.append(
                {
                    "case_id": case.case_code,
                    "origin_country": case.origin_country,
                    "grades_studied_abroad": grades_value,
                    "last_completed_grade_abroad": case.last_completed_grade_abroad,
                    "target_country": case.target_country,
                    "target_grade": case.target_grade,
                    "target_stream": case.target_stream,
                    "subject_focus": case.subject_focus,
                    "overall_difficulty": case.overall_difficulty,
                    "math_difficulty": case.math_difficulty,
                    "notes": case.notes,
                }
            )

    return pd.DataFrame(topic_rows), pd.DataFrame(edge_rows), pd.DataFrame(case_rows)

