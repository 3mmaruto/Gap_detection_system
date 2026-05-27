"""User and local MVP account persistence operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Role, School, User, UserRole
from app.schemas.db import UserCreate
from app.services.auth import hash_password


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_role_by_name(db: Session, name: str) -> Role | None:
    return db.scalar(select(Role).where(Role.name == name))


def get_or_create_demo_school(db: Session) -> School:
    school = db.scalar(select(School).where(School.code == "DRS-DEMO"))
    if school is None:
        school = School(
            name="Damascus Reintegration School",
            code="DRS-DEMO",
            type="demo",
            country="Syria",
            city="Damascus",
            status="active",
        )
        db.add(school)
        db.flush()
    return school


def assign_role(db: Session, user: User, role: Role, school_id: int | None = None) -> None:
    existing = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
            UserRole.school_id == school_id,
        )
    )
    if existing is None:
        db.add(UserRole(user_id=user.id, role_id=role.id, school_id=school_id))


def create_user(db: Session, payload: UserCreate) -> User:
    role = get_role_by_name(db, payload.role)
    if role is None:
        raise ValueError(f"Unknown role: {payload.role}")
    existing = get_user_by_email(db, payload.email)
    if existing is not None:
        raise ValueError("User already exists")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        status=payload.status,
    )
    db.add(user)
    db.flush()
    assign_role(db, user, role, payload.school_id)
    db.commit()
    db.refresh(user)
    return user


def bootstrap_demo_admin(db: Session) -> tuple[School, User]:
    school = get_or_create_demo_school(db)
    role = get_role_by_name(db, "school_admin")
    if role is None:
        raise ValueError("school_admin role has not been seeded")
    user = get_user_by_email(db, "admin")
    if user is None:
        user = User(
            full_name="Lina Haddad",
            email="admin",
            password_hash=hash_password("admin"),
            status="active",
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = user.full_name or "Lina Haddad"
        user.password_hash = hash_password("admin")
        user.status = "active"
    assign_role(db, user, role, school.id)
    db.commit()
    db.refresh(school)
    db.refresh(user)
    return school, user


def list_users(db: Session, role_name: str | None = None, school_id: int | None = None) -> list[User]:
    statement = select(User).order_by(User.id)
    if role_name or school_id is not None:
        statement = statement.join(UserRole, UserRole.user_id == User.id)
    if role_name:
        statement = statement.join(Role, Role.id == UserRole.role_id).where(Role.name == role_name)
    if school_id is not None:
        statement = statement.where(UserRole.school_id == school_id)
    return list(db.scalars(statement).unique())


def user_roles(db: Session, user_id: int) -> list[tuple[str, int | None, str | None]]:
    rows = db.execute(
        select(Role.name, UserRole.school_id, School.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .outerjoin(School, School.id == UserRole.school_id)
        .where(UserRole.user_id == user_id)
        .order_by(Role.name)
    ).all()
    return [(role_name, school_id, school_name) for role_name, school_id, school_name in rows]
