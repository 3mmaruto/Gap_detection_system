"""Database health and seed routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db, is_database_configured, ping_database
from app.schemas.db import RoleSeedResponse
from app.services.seed import seed_roles_and_permissions

router = APIRouter(prefix="/db", tags=["database"])


@router.get("/health")
def db_health() -> dict[str, object]:
    configured = is_database_configured()
    ok = False
    if configured:
        try:
            ok = ping_database()
        except Exception:
            ok = False
    return {"configured": configured, "ok": ok}


@router.post("/seed-roles", response_model=RoleSeedResponse)
def seed_roles(db: Session = Depends(get_db)) -> dict:
    try:
        return seed_roles_and_permissions(db)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

