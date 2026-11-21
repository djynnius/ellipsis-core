# elipsis

A scaffold for Python Flask apps: one fixed layout, with the pieces every app ends up needing already wired together.

- **Flask** with blueprints, one per route
- **SQLAlchemy** (plain SQLAlchemy, not Flask-SQLAlchemy) and **Alembic** for every migration
- **Jinja2** views with a base template and reusable elements
- **Vue.js** for reactivity, vendored in `assets/`
- **skeleton.js** placeholders for images, page sections and whole pages that are slow to load
- **Redis** for sessions and caching, so the app can run behind a load balancer
- **config.yaml** for settings, `.env` for secrets
- **Socket.IO** baked in but commented out
- **pytest** unit tests

elipsis is both this repository and an agent skill (`skills/elipsis`). The skill starts a new app from this repository when it can reach it, and rebuilds the same structure from its own notes when it cannot.

## Quick start

```bash
cp .env.example .env            # then set SECRET_KEY
uv sync                         # or: python -m venv .venv && .venv/bin/pip install -r requirements.txt
uv run alembic upgrade head     # creates databases/app.db
uv run python app.py            # http://127.0.0.1:5000
uv run pytest
```

## Structure

```
elipsis/
├── app.py                  # create_app(): config, database, Redis, blueprints
├── config.yaml             # settings; ${VAR:default} slots are filled from .env
├── .env.example            # copy to .env (gitignored)
├── pyproject.toml          # dependencies for uv
├── requirements.txt        # the same, for plain pip
├── alembic.ini
├── assets/                 # served at /assets
│   ├── css/                # base.css, skeleton.css
│   ├── scripts/            # app.js, skeleton.js, vendor/vue.global.prod.js
│   ├── images/
│   └── fonts/              # icon fonts and the like
├── views/                  # Jinja2 templates
│   ├── base.html           # the boilerplate other templates extend
│   ├── elements/           # reusable pieces: card, navbar, flash, skeleton
│   ├── errors/             # 404, 500
│   └── home/               # one folder per route, named after the route
├── routes/                 # one blueprint per file, registered automatically
│   └── home.py
├── controllers/            # functions and classes shared across the app
│   ├── config.py           # loads config.yaml
│   ├── database.py         # SQLAlchemy engine and db_session
│   └── cache.py            # Redis cache and sessions
├── models/                 # SQLAlchemy models
│   ├── base.py             # Base, StandardColumns, SoftDelete
│   └── user.py
├── migration/              # Alembic: env.py and versions/
├── databases/              # SQLite / .db files (contents gitignored)
├── uploads/                # files users upload (contents gitignored)
├── downloads/              # files offered for download (contents gitignored)
├── unit_tests/             # pytest
└── skills/elipsis/         # the agent skill
```

## Conventions

**Routes map to views.** A route called `business` is `routes/business.py`, exposes a blueprint named `blueprint`, and keeps its templates in `views/business/`. Every module in `routes/` is registered by `app.py` automatically.

```python
# routes/business.py
from flask import Blueprint, render_template

blueprint = Blueprint("business", __name__, url_prefix="/business")

@blueprint.get("/")
def index():
    return render_template("business/index.html")
```

**Reusable template pieces live in `views/elements/`.** Shared Python lives in `controllers/`; there is no helpers or factories folder.

**Every table gets the standard columns** `id`, `uuid`, `created_at`, `updated_at`, `created_by`, `updated_by` by inheriting `StandardColumns`. They fill themselves in; `created_by` and `updated_by` take the logged-in user from `session["user_id"]`. Leave the mixin off only for tables that cannot fill those columns. Add `SoftDelete` for `deleted_at` / `deleted_by` where rows must be recoverable.

```python
# models/business.py  (then import it in models/__init__.py)
class Business(StandardColumns, Base):
    __tablename__ = "businesses"
    name: Mapped[str] = mapped_column(String(200))
```

**Alembic owns the schema.**

```bash
uv run alembic revision --autogenerate -m "add businesses"
uv run alembic upgrade head
```

**Vue uses `[[ ]]`** so it does not clash with Jinja's `{{ }}`. Start an app with `Elipsis.createApp({...}).mount("#app")`.

**Anything slow gets a skeleton.**

```html
<!-- images: shimmer until loaded -->
<img data-skeleton src="..." width="320" height="180" alt="...">

<!-- a section waiting on data -->
<div v-if="loading">{{ skeleton.lines(3) }}</div>
<div v-skeleton="loading">...</div>
```

Navigating to a page that takes longer than 200 ms shows the page skeleton on its own. Put `data-no-skeleton` on download links and forms. A page that renders empty and then fetches its data sets `{% block body_attrs %}data-page-loading{% endblock %}` and calls `Skeleton.pageReady()` once the data is in. Details are at the top of `assets/scripts/skeleton.js`.

**Redis** is off by default so the scaffold runs anywhere. Set `REDIS_ENABLED=true` and `REDIS_URL` in `.env` to move sessions and `controllers.cache` into Redis; do this before running more than one instance.

**Socket.IO** is commented out in `pyproject.toml`, `app.py` and `views/base.html`. Uncomment all three to turn it on.

## Installing the skill

```bash
ln -s "$PWD/skills/elipsis" ~/.claude/skills/elipsis     # Claude Code
ln -s "$PWD/skills/elipsis" ~/.agents/skills/elipsis     # Codex and other harnesses that read ~/.agents/skills
```

Then ask for an elipsis app, or run `/elipsis`. Set `ELIPSIS_REPO` to this repository's git URL so the skill can pull the latest scaffold.
