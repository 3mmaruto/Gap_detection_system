"""Read routes for persisted KGDS results."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import DetectedGap, SupportRecommendation
from app.db.session import get_db
from app.schemas.db import DetectedGapRead, SupportRecommendationRead

router = APIRouter(tags=["analysis-results"])


@router.get("/detected-gaps", response_model=list[DetectedGapRead])
def list_detected_gaps(analysis_run_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    statement = select(DetectedGap).order_by(DetectedGap.id.desc()).offset(offset).limit(limit)
    if analysis_run_id is not None:
        statement = statement.where(DetectedGap.analysis_run_id == analysis_run_id)
    return list(db.scalars(statement))


@router.get("/support-recommendations", response_model=list[SupportRecommendationRead])
def list_support_recommendations(
    analysis_run_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    statement = select(SupportRecommendation).order_by(SupportRecommendation.id).offset(offset).limit(limit)
    if analysis_run_id is not None:
        statement = statement.where(SupportRecommendation.analysis_run_id == analysis_run_id)
    return list(db.scalars(statement))

