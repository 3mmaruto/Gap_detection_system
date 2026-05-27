"""Student CRUD and registration workflow routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.repositories import students as repo
from app.repositories.users import user_roles
from app.routes.auth import get_current_user
from app.schemas.db import StudentCreate, StudentProfileRead, StudentRead, StudentRegistrationRequest, StudentRegistrationResponse, StudentUpdate

router = APIRouter(prefix="/students", tags=["students"])


def _primary_school_id(db: Session, current_user: User, requested_school_id: int | None = None) -> int:
    roles = user_roles(db, current_user.id)
    user_school_ids = [school_id for _role_name, school_id, _school_name in roles if school_id is not None]
    if requested_school_id is not None:
        if user_school_ids and requested_school_id not in user_school_ids:
            raise HTTPException(status_code=403, detail="User is not assigned to the requested school")
        return requested_school_id
    if not user_school_ids:
        raise HTTPException(status_code=400, detail="Current user is not assigned to a school")
    return user_school_ids[0]


@router.post("", response_model=StudentRead)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    return repo.create_student(db, payload)


@router.get("", response_model=list[StudentRead])
def list_students(
    school_id: int | None = None,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    return repo.list_students(db, school_id=school_id, q=q, limit=limit, offset=offset)


@router.post("/register", response_model=StudentRegistrationResponse)
def register_student(
    payload: StudentRegistrationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (payload.student_phone or payload.mother_phone or payload.father_phone):
        raise HTTPException(status_code=422, detail="At least one phone number is required")
    school_id = _primary_school_id(db, current_user, payload.school_id)
    student, case, paths, documents = repo.register_student(db, payload, school_id, current_user.id)
    return {"student": student, "case": case, "education_paths": paths, "documents": documents}


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = repo.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/profile", response_model=StudentProfileRead)
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    student, cases, paths, documents = repo.get_student_profile(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"student": student, "cases": cases, "education_paths": paths, "documents": documents}


@router.patch("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = repo.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return repo.update_student(db, student, payload)

