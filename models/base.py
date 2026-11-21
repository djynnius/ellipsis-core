"""Declarative base and the standard columns every ellipsis table carries.

    class Business(StandardColumns, Base):
        __tablename__ = "businesses"
        name: Mapped[str] = mapped_column(String(200))

`StandardColumns` gives a table: id, uuid, created_at, updated_at, created_by,
updated_by. Leave it off only when a table cannot fill those columns (pure
association tables, for example). Add `SoftDelete` when rows must be
recoverable instead of physically deleted.

created_by / updated_by are filled from the "actor": the id of the logged-in
user, which app.py sets per request from session["user_id"]. Outside a request
(scripts, jobs) call `set_actor(user_id)` yourself, or leave them NULL.
"""

import uuid as uuid_lib
from contextvars import ContextVar
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

_actor = ContextVar("ellipsis_actor", default=None)


def set_actor(user_id):
    _actor.set(user_id)


def get_actor():
    return _actor.get()


def utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class StandardColumns:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, sort_order=-10)
    uuid: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, default=lambda: str(uuid_lib.uuid4()), sort_order=-9
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, sort_order=90)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, sort_order=91
    )
    created_by: Mapped[int | None] = mapped_column(Integer, default=get_actor, sort_order=92)
    updated_by: Mapped[int | None] = mapped_column(Integer, default=get_actor, onupdate=get_actor, sort_order=93)


class SoftDelete:
    """Opt-in: mark rows deleted instead of removing them. Filter on `deleted_at IS NULL`."""

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True, sort_order=94)
    deleted_by: Mapped[int | None] = mapped_column(Integer, sort_order=95)

    def soft_delete(self):
        self.deleted_at = utcnow()
        self.deleted_by = get_actor()
