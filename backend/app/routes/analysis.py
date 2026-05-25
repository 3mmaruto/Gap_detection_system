"""Student analysis routes."""

from fastapi import APIRouter, HTTPException, status

from app.db.session import SessionLocal, is_database_configured
from app.logic.analysis import analyze_student_case
from app.logic.config import settings
from app.logic.data_loader import DataLoadError
from app.models.student_case import AnalysisResponse, StudentCaseInput
from app.services.analysis_persistence import persist_analysis_result

router = APIRouter(tags=["analysis"])


@router.post("/analyze-student-case", response_model=AnalysisResponse)
def analyze(case_input: StudentCaseInput) -> dict:
    try:
        result = analyze_student_case(case_input)
        if settings.persist_analysis and is_database_configured() and SessionLocal is not None:
            with SessionLocal() as db:
                run_id = persist_analysis_result(db, case_input, result)
            result.setdefault("summary", {})["analysis_run_id"] = run_id
        return result
    except DataLoadError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

