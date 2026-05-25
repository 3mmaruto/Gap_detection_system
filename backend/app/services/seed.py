"""Seed baseline RBAC data."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Permission, Role, RolePermission


BASE_ROLES = {
    "platform_super_admin": "Technical/system owner with auditable full access.",
    "ministry_admin": "Ministry-level dashboard and monitoring access.",
    "ministry_analyst": "Aggregated analytics access across schools.",
    "school_admin": "School administrative employee with operational access.",
    "teacher": "Teacher scoped to assigned sections and students.",
    "student": "Future student portal account.",
}

BASE_PERMISSIONS = [
    "schools:manage",
    "users:manage",
    "students:manage",
    "curriculum:manage",
    "analysis:run",
    "analysis:view",
    "documents:upload",
    "documents:review",
    "analytics:view_ministry",
    "analytics:view_school",
]


def seed_roles_and_permissions(db: Session) -> dict[str, int]:
    roles_created = 0
    permissions_created = 0
    role_permissions_created = 0

    roles: dict[str, Role] = {}
    for name, description in BASE_ROLES.items():
        role = db.scalar(select(Role).where(Role.name == name))
        if role is None:
            role = Role(name=name, description=description)
            db.add(role)
            db.flush()
            roles_created += 1
        roles[name] = role

    permissions: dict[str, Permission] = {}
    for code in BASE_PERMISSIONS:
        permission = db.scalar(select(Permission).where(Permission.code == code))
        if permission is None:
            permission = Permission(code=code, description=code.replace(":", " "))
            db.add(permission)
            db.flush()
            permissions_created += 1
        permissions[code] = permission

    for role_name, role in roles.items():
        codes = BASE_PERMISSIONS if role_name == "platform_super_admin" else [c for c in BASE_PERMISSIONS if c != "schools:manage"]
        for code in codes:
            exists = db.scalar(
                select(RolePermission).where(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == permissions[code].id,
                )
            )
            if exists is None:
                db.add(RolePermission(role_id=role.id, permission_id=permissions[code].id))
                role_permissions_created += 1

    db.commit()
    return {
        "roles_created": roles_created,
        "permissions_created": permissions_created,
        "role_permissions_created": role_permissions_created,
    }
