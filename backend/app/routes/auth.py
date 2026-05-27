"""Local MVP authentication and demo bootstrap routes."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_db
from app.repositories.users import bootstrap_demo_admin, get_user_by_email, user_roles
from app.schemas.db import BootstrapDemoResponse, CurrentUserRead, LoginRequest, TokenResponse
from app.services.auth import create_access_token, decode_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    header = request.headers.get("authorization") or ""
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.get(User, int(payload["sub"]))
    if user is None or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not active")
    return user


def serialize_current_user(db: Session, user: User) -> CurrentUserRead:
    roles = user_roles(db, user.id)
    primary = roles[0] if roles else (None, None, None)
    return CurrentUserRead(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        roles=[role_name for role_name, _school_id, _school_name in roles],
        school_id=primary[1],
        school_name=primary[2],
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = get_user_by_email(db, payload.username)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=CurrentUserRead)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CurrentUserRead:
    return serialize_current_user(db, current_user)


@router.post("/bootstrap-demo", response_model=BootstrapDemoResponse)
def bootstrap_demo(db: Session = Depends(get_db)) -> BootstrapDemoResponse:
    enabled = os.getenv("KGDS_DEV_BOOTSTRAP_ENABLED", "false").lower() in {"1", "true", "yes"}
    if not enabled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Demo bootstrap is disabled")
    school, user = bootstrap_demo_admin(db)
    return BootstrapDemoResponse(school_id=school.id, user_id=user.id, email=user.email or "admin", role="school_admin")
