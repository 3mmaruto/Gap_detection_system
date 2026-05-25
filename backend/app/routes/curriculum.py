"""Curriculum database routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.curriculum import list_edges, list_topics
from app.schemas.db import CurriculumEdgeRead, CurriculumImportRequest, CurriculumImportResponse, CurriculumTopicRead
from app.services.curriculum_import import import_current_sources

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.post("/import", response_model=CurriculumImportResponse)
def import_curriculum(payload: CurriculumImportRequest, db: Session = Depends(get_db)) -> dict:
    summary = import_current_sources(
        db,
        source_type=payload.source_type,
        source_uri=payload.source_uri,
        import_topics=payload.import_topics,
        import_edges=payload.import_edges,
        import_student_cases=payload.import_student_cases,
    )
    return {"batch_id": summary.get("batch_id"), "status": "completed", "summary": summary}


@router.get("/topics", response_model=list[CurriculumTopicRead])
def get_topics(
    country: str | None = None,
    grade: str | None = None,
    stream: str | None = None,
    subject_id: int | None = None,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    return list_topics(db, country=country, grade=grade, stream=stream, subject_id=subject_id, q=q, limit=limit, offset=offset)


@router.get("/edges", response_model=list[CurriculumEdgeRead])
def get_edges(relation_type: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return list_edges(db, relation_type=relation_type, limit=limit, offset=offset)

