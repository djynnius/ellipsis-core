import pytest

from app import create_app
from controllers.database import db_session
from models import Base, set_actor


@pytest.fixture
def app(tmp_path):
    """An app on a throwaway SQLite file, with Redis off."""
    app = create_app(
        {
            "app": {"debug": False, "secret_key": "test"},
            "database": {"url": f"sqlite:///{tmp_path / 'test.db'}"},
            "redis": {"enabled": False},
        }
    )
    app.config["TESTING"] = True
    Base.metadata.create_all(app.extensions["db_engine"])
    yield app
    db_session.remove()
    set_actor(None)
    app.extensions["db_engine"].dispose()


@pytest.fixture
def client(app):
    return app.test_client()
