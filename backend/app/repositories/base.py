"""Small repository helpers."""

from __future__ import annotations

from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

T = TypeVar("T")


def apply_updates(instance: T, values: dict[str, Any]) -> T:
    for key, value in values.items():
        if value is not None:
            setattr(instance, key, value)
    return instance


def get_by_id(db: Session, model: type[T], item_id: int) -> T | None:
    return db.scalar(select(model).where(model.id == item_id))

