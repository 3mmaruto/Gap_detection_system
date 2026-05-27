"""Minimal user management routes for the local MVP."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.repositories import users as repo
from app.routes.auth import get_current_user
from app.schemas.db import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


def _serialize_user(db: Session, user: User) -> UserRead:
    roles = repo.user_roles(db, user.id)
    primary = roles[0] if roles else (None, None, None)
    return UserRead(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        status=user.status,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[role_name for role_name, _school_id, _school_name in roles],
        school_id=primary[1],
        school_name=primary[2],
    )


@router.get("", response_model=list[UserRead])
def list_users(
    role: str | None = None,
    school_id: int | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[UserRead]:
    return [_serialize_user(db, user) for user in repo.list_users(db, role_name=role, school_id=school_id)]


@router.post("/teachers", response_model=UserRead)
def create_teacher(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    current_roles = repo.user_roles(db, current_user.id)
    current_school_id = current_roles[0][1] if current_roles else None
    create_payload = payload.model_copy(update={"role": "teacher", "school_id": payload.school_id or current_school_id})
    try:
        user = repo.create_user(db, create_payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_user(db, user)
