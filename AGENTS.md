# Working in an ellipsis app

This app follows the ellipsis layout. README.md has the full tree; these are the rules to keep.

- **Routes**: one file per route in `routes/`, exposing a blueprint named `blueprint`. It is registered automatically. Its templates go in `views/<route name>/`.
- **Views**: extend `views/base.html` unless the page is deliberately different (login, landing). Reusable pieces go in `views/elements/`.
- **Shared Python** goes in `controllers/`. Do not add helpers, utils, services or factories folders.
- **Models** go in `models/`, inherit `StandardColumns` (id, uuid, created_at, updated_at, created_by, updated_by) unless the table cannot fill those columns, and are imported in `models/__init__.py`. Use plain SQLAlchemy through `controllers.database.db_session`, never Flask-SQLAlchemy.
- **Schema changes** always go through Alembic: `uv run alembic revision --autogenerate -m "..."`, review the file, then `uv run alembic upgrade head`. Never call `create_all` in app code.
- **Settings** go in `config.yaml`; secrets go in `.env` and are referenced as `${VAR}`.
- **Front end**: Vue with `[[ ]]` delimiters via `Ellipsis.createApp`. Assets live under `assets/css`, `assets/scripts`, `assets/images`, `assets/fonts`.
- **Loading states**: every image gets `data-skeleton` plus a width and height; every section that waits on data shows a skeleton (`skeleton.lines()`, `skeleton.card()`, or `v-skeleton`). See the top of `assets/scripts/skeleton.js`.
- **Sessions and caching** go through Redis (`controllers/cache.py`). Keep no per-process state that a second app instance would need.
- **Tests**: every change comes with pytest tests in `unit_tests/`. Run `uv run pytest` before calling work done.
