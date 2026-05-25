"""Analysis run read operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AnalysisRun
from app.repositories.base import get_by_id


def list_analysis_runs(db: Session, limit: int = 100, offset: int = 0) -> list[AnalysisRun]:
    return list(db.scalars(select(AnalysisRun).order_by(AnalysisRun.id.desc()).offset(offset).limit(limit)))


def get_analysis_run(db: Session, run_id: int) -> AnalysisRun | None:
    return get_by_id(db, AnalysisRun, run_id)

