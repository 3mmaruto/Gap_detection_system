"""Student case CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import student_cases as repo
from app.schemas.db import StudentCaseCreate, StudentCaseRead

router = APIRouter(prefix="/student-cases", tags=["student-cases"])


@router.post("", response_model=StudentCaseRead)
def create_student_case(payload: StudentCaseCreate, db: Session = Depends(get_db)):
    return repo.create_student_case(db, payload)


@router.get("", response_model=list[StudentCaseRead])
def list_student_cases(source_type: str | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return repo.list_student_cases(db, source_type=source_type, limit=limit, offset=offset)


@router.get("/{case_id}", response_model=StudentCaseRead)
def get_student_case(case_id: int, db: Session = Depends(get_db)):
    case = repo.get_student_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Student case not found")
    return case

