"""Student CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import students as repo
from app.schemas.db import StudentCreate, StudentRead, StudentUpdate

router = APIRouter(prefix="/students", tags=["students"])


@router.post("", response_model=StudentRead)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    return repo.create_student(db, payload)


@router.get("", response_model=list[StudentRead])
def list_students(school_id: int | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return repo.list_students(db, school_id=school_id, limit=limit, offset=offset)


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = repo.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.patch("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = repo.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return repo.update_student(db, student, payload)

