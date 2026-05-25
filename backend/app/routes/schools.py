"""School CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import schools as repo
from app.schemas.db import SchoolCreate, SchoolRead, SchoolUpdate

router = APIRouter(prefix="/schools", tags=["schools"])


@router.post("", response_model=SchoolRead)
def create_school(payload: SchoolCreate, db: Session = Depends(get_db)):
    return repo.create_school(db, payload)


@router.get("", response_model=list[SchoolRead])
def list_schools(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return repo.list_schools(db, limit=limit, offset=offset)


@router.get("/{school_id}", response_model=SchoolRead)
def get_school(school_id: int, db: Session = Depends(get_db)):
    school = repo.get_school(db, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school


@router.patch("/{school_id}", response_model=SchoolRead)
def update_school(school_id: int, payload: SchoolUpdate, db: Session = Depends(get_db)):
    school = repo.get_school(db, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return repo.update_school(db, school, payload)

