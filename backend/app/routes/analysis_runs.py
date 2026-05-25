"""Analysis persistence read routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.analysis_runs import get_analysis_run, list_analysis_runs
from app.schemas.db import AnalysisRunRead

router = APIRouter(prefix="/analysis-runs", tags=["analysis-runs"])


@router.get("", response_model=list[AnalysisRunRead])
def list_runs(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return list_analysis_runs(db, limit=limit, offset=offset)


@router.get("/{run_id}", response_model=AnalysisRunRead)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = get_analysis_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return run

