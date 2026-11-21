import uuid

from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from controllers.database import db_session
from models import SoftDelete, StandardColumns, User, set_actor


class LocalBase(DeclarativeBase):
    """Kept apart from the app's Base so this table never reaches Alembic."""


class Note(StandardColumns, SoftDelete, LocalBase):
    __tablename__ = "test_notes"
    body: Mapped[str] = mapped_column(String(200))


def test_standard_columns_are_filled_on_insert(app):
    set_actor(7)
    user = User(email="ada@example.com", name="Ada")
    db_session.add(user)
    db_session.commit()

    assert user.id is not None
    assert uuid.UUID(user.uuid)
    assert user.created_at is not None and user.updated_at is not None
    assert user.created_by == 7 and user.updated_by == 7


def test_update_changes_updated_columns_only(app):
    set_actor(1)
    user = User(email="ada@example.com", name="Ada")
    db_session.add(user)
    db_session.commit()
    first_update = user.updated_at

    set_actor(2)
    user.name = "Ada Lovelace"
    db_session.commit()

    assert user.created_by == 1
    assert user.updated_by == 2
    assert user.updated_at >= first_update


def test_actor_is_optional(app):
    user = User(email="nobody@example.com", name="Nobody")
    db_session.add(user)
    db_session.commit()
    assert user.created_by is None and user.updated_by is None


def test_request_actor_comes_from_the_session(app, client):
    @app.get("/_make_user")
    def make_user():
        user = User(email="req@example.com", name="Req")
        db_session.add(user)
        db_session.commit()
        return {"created_by": user.created_by}

    with client.session_transaction() as session:
        session["user_id"] = 42
    assert client.get("/_make_user").get_json() == {"created_by": 42}


def test_soft_delete_marks_the_row(app):
    LocalBase.metadata.create_all(app.extensions["db_engine"])
    set_actor(3)
    note = Note(body="hello")
    db_session.add(note)
    db_session.commit()
    assert note.deleted_at is None

    note.soft_delete()
    db_session.commit()
    assert note.deleted_at is not None and note.deleted_by == 3


def test_standard_columns_exist_on_every_model():
    expected = {"id", "uuid", "created_at", "updated_at", "created_by", "updated_by"}
    assert expected <= set(User.__table__.columns.keys())
