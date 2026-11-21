"""Alembic environment. Uses the app's config.yaml and the metadata of models/."""

from logging.config import fileConfig

from alembic import context

from controllers.config import load_config
from controllers.database import build_engine
from models import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations():
    # A caller (the unit tests) may hand over its own engine.
    engine = config.attributes.get("engine") or build_engine(load_config()["database"])
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            # SQLite cannot ALTER most things; batch mode rebuilds the table instead.
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


run_migrations()
