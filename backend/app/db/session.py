"""Database engine/session configuration."""

from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL")
DB_REQUIRED = os.getenv("KGDS_DB_REQUIRED", "false").lower() in {"1", "true", "yes"}

engine: Engine | None = None
SessionLocal: sessionmaker[Session] | None = None

if DATABASE_URL:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def is_database_configured() -> bool:
    return engine is not None and SessionLocal is not None


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ping_database() -> bool:
    if engine is None:
        return False
    with engine.connect() as connection:
        connection.execute(text("select 1"))
    return True

