"""SQLAlchemy engine and session (plain SQLAlchemy, not Flask-SQLAlchemy).

Use `db_session` anywhere in the app:

    from controllers.database import db_session
    users = db_session.scalars(select(User)).all()

It is scoped to the current thread/request and removed when the request ends.
"""

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import scoped_session, sessionmaker

from controllers.config import BASE_DIR

db_session = scoped_session(sessionmaker(autoflush=False, expire_on_commit=False))


def build_engine(database_config):
    url = make_url(database_config["url"])
    is_file_sqlite = url.drivername.startswith("sqlite") and url.database not in (None, "", ":memory:")
    if is_file_sqlite:
        # Resolve from the project root so the app, Alembic and tests agree on the file.
        url = url.set(database=str(BASE_DIR / url.database))
    return create_engine(url, echo=bool(database_config.get("echo", False)), pool_pre_ping=True)


def init_db(app):
    engine = build_engine(app.config["ELLIPSIS"]["database"])
    db_session.remove()
    db_session.configure(bind=engine)
    app.extensions["db_engine"] = engine

    @app.teardown_appcontext
    def remove_session(exception=None):
        if exception is not None:
            db_session.rollback()
        db_session.remove()

    return engine
