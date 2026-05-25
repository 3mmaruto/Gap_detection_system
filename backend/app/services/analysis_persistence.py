"""Optional persistence for rule-based analysis outputs."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AnalysisRun, CurriculumTopic, DetectedGap, GraphSnapshot, StudentCase, SupportRecommendation
from app.models.student_case import StudentCaseInput


def persist_analysis_result(db: Session, case_input: StudentCaseInput, result: dict[str, Any]) -> int:
    case_code = case_input.case_id or f"manual-{datetime.now(timezone.utc).isoformat()}"
    case = db.scalar(select(StudentCase).where(StudentCase.case_code == case_code))
    if case is None:
        case = StudentCase(
            case_code=case_code,
            origin_country=case_input.origin_country,
            target_country=case_input.target_country,
            target_grade=case_input.target_grade,
            target_stream=case_input.target_stream,
            subject_focus=case_input.subject_focus,
            grades_studied_abroad=case_input.grades_studied_abroad,
            last_completed_grade_abroad=case_input.last_completed_grade_abroad,
            overall_difficulty=case_input.overall_difficulty,
            math_difficulty=case_input.math_difficulty,
            notes=case_input.notes,
            raw_input_json=case_input.model_dump(),
            source_type="api",
        )
        db.add(case)
        db.flush()

    run = AnalysisRun(
        case_id=case.id,
        student_id=case.student_id,
        school_id=case.school_id,
        analysis_type="rule_based_gap_detection",
        input_snapshot_json=case_input.model_dump(),
        rule_engine_version="prototype-refactor-v1",
        status="completed",
        completed_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.flush()

    topic_lookup = {
        topic.external_topic_id: topic.id
        for topic in db.scalars(select(CurriculumTopic).where(CurriculumTopic.external_topic_id.is_not(None)))
    }

    for index, item in enumerate(result.get("support_first_topics", []), start=1):
        topic_id = topic_lookup.get(item.get("from_topic_id"))
        db.add(
            DetectedGap(
                analysis_run_id=run.id,
                topic_id=topic_id,
                gap_type=item.get("coverage_status") or "likely_missed_due_to_switch",
                status="open",
                evidence_json=item,
                explanation_text=item.get("status_label") or item.get("supported_targets"),
            )
        )
        db.add(
            SupportRecommendation(
                analysis_run_id=run.id,
                topic_id=topic_id,
                priority_rank=index,
                recommendation_type="support_first_topic",
                reason_text=item.get("supported_targets") or item.get("status_label") or "Support-first topic",
                evidence_json=item,
            )
        )

    graph_summary = result.get("graph_summary") or {}
    if graph_summary:
        db.add(
            GraphSnapshot(
                analysis_run_id=run.id,
                graph_type="student_graph_preview",
                nodes_json=graph_summary.get("preview_nodes", []),
                edges_json=graph_summary.get("preview_edges", []),
            )
        )

    db.commit()
    return run.id

