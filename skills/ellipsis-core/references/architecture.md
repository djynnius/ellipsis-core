# ellipsis architecture

Everything needed to rebuild the ellipsis scaffold with no access to its repository. Build the files in the order of the sections below, then run the checks at the end.

## Contents

1. Tree
2. Dependencies and project files
3. config.yaml and .env
4. controllers/
5. models/
6. routes/
7. app.py
8. migration/ (Alembic)
9. views/
10. assets/ (Vue, skeleton.js)
11. unit_tests/
12. Checks

## 1. Tree

```
<app>/
├── app.py
├── config.yaml
├── .env.example            # .env is the gitignored copy
├── .gitignore              # .env, .venv/, __pycache__/, *.py[cod], .pytest_cache/, flask_session/
├── pyproject.toml
├── requirements.txt        # same dependencies, for plain pip
├── alembic.ini
├── README.md               # must include this tree
├── AGENTS.md               # the conventions, for coding agents
├── CLAUDE.md               # one line: @AGENTS.md
├── assets/
│   ├── css/                # base.css, skeleton.css
│   ├── scripts/            # app.js, skeleton.js, vendor/vue.global.prod.js
│   ├── images/
│   └── fonts/
├── views/
│   ├── base.html
│   ├── elements/           # card.html, navbar.html, flash.html, skeleton.html
│   ├── errors/             # 404.html, 500.html
│   └── home/index.html
├── routes/                 # __init__.py, home.py
├── controllers/            # __init__.py, config.py, database.py, cache.py
├── models/                 # __init__.py, base.py, user.py
├── migration/              # env.py, script.py.mako, versions/
├── databases/
├── uploads/
├── downloads/
└── unit_tests/             # conftest.py, test_app.py, test_models.py, test_controllers.py
```

Folder names are fixed. Empty folders that must exist in git hold a `.gitkeep` (`assets/images`, `assets/fonts`, `migration/versions`). `databases/`, `uploads/` and `downloads/` instead hold a `.gitignore` that ignores their contents:

```
*
!.gitignore
```

`uploads/` and `downloads/` also hold a `.ellipsis` placeholder, a two-line comment naming the folder's purpose and its `app.config` key (`UPLOAD_FOLDER`, `DOWNLOAD_FOLDER`). Their `.gitignore` adds `!.ellipsis` so it stays tracked.

## 2. Dependencies and project files

`pyproject.toml`: `requires-python = ">=3.11"`; dependencies `flask>=3.0`, `sqlalchemy>=2.0`, `alembic>=1.13`, `pyyaml>=6.0`, `python-dotenv>=1.0`, `redis>=5.0`, `flask-session>=0.8`, and `flask-socketio>=5.3` present but commented out. Dev group: `pytest>=8.0`. Also:

```toml
[tool.uv]
package = false

[tool.pytest.ini_options]
testpaths = ["unit_tests"]
pythonpath = ["."]
```

Not allowed: Flask-SQLAlchemy, Flask-Migrate. The app uses SQLAlchemy and Alembic directly.

`alembic.ini`: `script_location = migration`, `prepend_sys_path = .`, `path_separator = os`, a dated `file_template`, standard logging sections. It holds no database URL.

## 3. config.yaml and .env

`config.yaml` holds all settings. A value may contain `${VAR}` or `${VAR:default}`, filled from the environment after `.env` is loaded. Secrets are always slots, never literals.

```yaml
app:
  name: <app name>
  debug: ${APP_DEBUG:false}
  host: ${APP_HOST:127.0.0.1}
  port: ${APP_PORT:5000}
  secret_key: ${SECRET_KEY:change-me}
database:
  url: ${DATABASE_URL:sqlite:///databases/app.db}
  echo: false
redis:
  enabled: ${REDIS_ENABLED:false}
  url: ${REDIS_URL:redis://localhost:6379/0}
  key_prefix: "<app name>:"
  default_ttl: 300
  session_lifetime: 86400
storage:
  uploads: uploads
  downloads: downloads
  max_upload_mb: 16
# socketio:
#   message_queue: ${REDIS_URL:redis://localhost:6379/0}
```

`.env.example` lists every variable used above with development values.

## 4. controllers/

Shared code lives here and nowhere else.

**config.py**
- `BASE_DIR`: the project root (`Path(__file__).resolve().parent.parent`).
- `load_config(path=None, overrides=None) -> dict`: loads `BASE_DIR/.env` with python-dotenv, reads the YAML at `path`, else `$ELLIPSIS_CONFIG`, else `BASE_DIR/config.yaml`, expands slots recursively, then deep-merges `overrides` on top (tests use this).
- Slot rules: a missing variable with no default raises `KeyError` naming it. When the whole value is a single slot, the result is passed through `yaml.safe_load` so `"false"` becomes `False` and `"5000"` becomes `5000`; a slot inside a longer string stays text.

**database.py**
- `db_session = scoped_session(sessionmaker(autoflush=False, expire_on_commit=False))`, module level, imported everywhere.
- `build_engine(database_config)`: `create_engine` with `pool_pre_ping=True`. A relative SQLite file path is resolved against `BASE_DIR` so the app, Alembic and tests agree on the file.
- `init_db(app)`: builds the engine from `app.config["ELLIPSIS"]["database"]`, calls `db_session.remove()` then `db_session.configure(bind=engine)`, stores the engine in `app.extensions["db_engine"]`, and registers a `teardown_appcontext` that rolls back on exception and always calls `db_session.remove()`.

**cache.py**
- `class Cache` with `init_app(app)`, `get(key, default=None)`, `set(key, value, ttl=None)`, `delete(key)`, `ping()`. Values are JSON. Keys get `redis.key_prefix`. `ttl=None` means `redis.default_ttl`.
- Redis enabled: `self.client = redis.Redis.from_url(url)`, and Flask-Session is configured on the app with `SESSION_TYPE="redis"`, `SESSION_REDIS=self.client`, `SESSION_KEY_PREFIX="<prefix>session:"`, `SESSION_PERMANENT=True`, `PERMANENT_SESSION_LIFETIME` from `session_lifetime`.
- Redis disabled: same interface backed by a dict with expiry; sessions stay Flask's signed cookies. `ping()` returns `None` when disabled, else `True`/`False`.
- Module-level `cache = Cache()` and a decorator `cached(ttl=None, key=None)` keyed by module, qualified name and arguments.

## 5. models/

**base.py** is the heart of the model convention. Reproduce it as is:

```python
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
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True, sort_order=94)
    deleted_by: Mapped[int | None] = mapped_column(Integer, sort_order=95)

    def soft_delete(self):
        self.deleted_at = utcnow()
        self.deleted_by = get_actor()
```

Rules: every table inherits `StandardColumns` unless it cannot fill those columns. `SoftDelete` is opt-in. `created_by` / `updated_by` hold a `users.id` and are nullable because scripts and jobs may have no user.

**user.py**: `class User(StandardColumns, Base)`, table `users`, with `email` (String 255, unique, indexed) and `name` (String 200).

**__init__.py**: imports `Base`, `StandardColumns`, `SoftDelete`, `set_actor`, `get_actor` and every model. Alembic autogenerate only sees models imported here.

## 6. routes/

**__init__.py**: `register_blueprints(app)` walks the package with `pkgutil.iter_modules`, imports each module, and registers its `blueprint` attribute when it is a Flask `Blueprint`.

**home.py**: `blueprint = Blueprint("home", __name__)`; `GET /` renders `home/index.html`; `GET /api/status` returns `{"database": bool, "redis": true|false|null}` by running `SELECT 1` through `db_session` and calling `cache.ping()`.

A route named `<name>` is always `routes/<name>.py` with templates in `views/<name>/`.

## 7. app.py

`create_app(config_overrides=None)`:

1. `config = load_config(overrides=config_overrides)`
2. `Flask(__name__, template_folder="views", static_folder="assets", static_url_path="/assets")`
3. `app.config`: `ELLIPSIS` (the whole config dict), `SECRET_KEY`, `DEBUG`, `UPLOAD_FOLDER` and `DOWNLOAD_FOLDER` (absolute, under `BASE_DIR`), `MAX_CONTENT_LENGTH`.
4. `init_db(app)`, `cache.init_app(app)`, `register_blueprints(app)`.
5. `before_request`: `set_actor(session.get("user_id"))`.
6. Context processor providing `app_name`.
7. Error handlers for 404 and 500 rendering `errors/404.html` and `errors/500.html`.

`if __name__ == "__main__"` runs the app on the configured host and port. Socket.IO appears only as comments: the import, `socketio = SocketIO()`, `socketio.init_app(app, message_queue=...)`, and `socketio.run(...)`.

## 8. migration/ (Alembic)

**env.py**: `target_metadata = models.Base.metadata`. The engine is `config.attributes.get("engine")` when a caller supplies one (tests do), otherwise `build_engine(load_config()["database"])`. Configure with `compare_type=True` and `render_as_batch=True` when the dialect is SQLite. Online mode only.

**script.py.mako**: the standard Alembic template.

**versions/**: generate the first revision with `alembic revision --autogenerate -m "create users"` rather than writing it by hand.

## 9. views/

**base.html** contains, in order: the import `{% import "elements/skeleton.html" as skeleton %}`; head with `{% block title %}`, `css/skeleton.css`, `css/base.css`, a `<noscript>` style that hides `#page-skeleton` and shows `[data-page-content]`, and `{% block head %}`; then

```html
<body {% block body_attrs %}{% endblock %}>
  {% include "elements/navbar.html" %}
  <div class="container">
    <div id="page-skeleton" aria-hidden="true">
      {% block page_skeleton %}{{ skeleton.page() }}{% endblock %}
    </div>
    <main data-page-content>
      {% include "elements/flash.html" %}
      {% block content %}{% endblock %}
    </main>
  </div>
  <!-- scripts, in this order: vendor/vue.global.prod.js, (commented Socket.IO client), skeleton.js, app.js -->
  {% block scripts %}{% endblock %}
</body>
```

All asset URLs use `url_for('static', filename=...)`.

**elements/**
- `skeleton.html`: macros `lines(count=3)` (spans with `skeleton skeleton-line`), `card(lines_count=3)`, `block(height="9rem")`, `page()` (a title, two lines and two cards).
- `card.html`: macro `card(title=None)` used with `{% call %}`.
- `navbar.html`, `flash.html`: includes.

**home/index.html**: extends base; a Vue app (`#app`, `v-cloak`) that fetches `/api/status`, showing `skeleton.lines(2)` while `loading`; and one `<img data-skeleton ...>` as the image example.

**errors/404.html**, **errors/500.html**: extend base.

## 10. assets/

**scripts/vendor/vue.global.prod.js**: Vue 3 global build, vendored (it includes the template compiler, which in-DOM templates need).

**scripts/app.js** defines `window.Ellipsis`:
- `createApp(options)`: `Vue.createApp(options)`, then `app.config.compilerOptions.delimiters = ["[[", "]]"]` and `app.use(Skeleton.vue)`.
- `getJSON(url, options)`: fetch, reject when `!response.ok`, return parsed JSON.

**css/skeleton.css**
- `.skeleton`: an animated left-to-right gradient set as the element's own `background` (not a pseudo-element, so it also works on `<img>`), `color: transparent`, `pointer-events: none`, rounded corners; `.skeleton > * { visibility: hidden }`. Colours come from `--skeleton-base` / `--skeleton-shine` with a dark-scheme variant. Animation is disabled under `prefers-reduced-motion`.
- `.skeleton-failed`: static block for an image that failed.
- Shapes: `.skeleton-line`, `.skeleton-title`, `.skeleton-block`.
- Page skeleton: `#page-skeleton { display: none }`; `[data-page-loading] #page-skeleton { display: block }`; `[data-page-loading] [data-page-content] { display: none }`.
- `[v-cloak] { display: none }`.

**scripts/skeleton.js** defines `window.Skeleton`, in plain JavaScript with no dependencies:
- `show(el)` / `hide(el)` add or remove the `skeleton` class and `aria-busy`. `toggle(el, loading)`. `until(el, promise)` shows until the promise settles.
- Images: every `img[data-skeleton]` that is not already complete gets the skeleton until its `load` event; on `error` it gets `skeleton-failed` instead. A `MutationObserver` on `document.body` applies the same to images added later.
- `pageLoading()` / `pageReady()` set or remove `data-page-loading` on `<body>`.
- Slow navigation: on a plain left click on a same-origin link, or a form submit, start a 200 ms timer that calls `pageLoading()`, so fast pages never flash a skeleton. Skip when the event was `defaultPrevented`, a modifier key is held, the link has `target` or `download`, it is a same-page hash link, or it sits inside `[data-no-skeleton]`. After 10 s with no new page, call `pageReady()`. On `pageshow` with `event.persisted`, call `pageReady()`.
- `Skeleton.vue`: a Vue plugin registering the `v-skeleton` directive (`mounted` and `updated` call `toggle(el, binding.value)`).

**css/base.css**: plain layout styles (`.navbar`, `.container`, `.grid`, `.card`, `.flash`, `.muted`) with light and dark colours. No CSS framework.

## 11. unit_tests/

**conftest.py**: an `app` fixture calling `create_app` with overrides for a SQLite file under `tmp_path` and `redis.enabled: False`, then `Base.metadata.create_all(engine)`; teardown removes the session, clears the actor and disposes the engine. A `client` fixture.

Cover at least:
- the home page renders and includes `skeleton.js` and `#page-skeleton`; `/api/status` JSON; the 404 view; assets served under `/assets`
- standard columns fill on insert, `updated_by` changes on update while `created_by` does not, the actor is optional, the actor comes from `session["user_id"]` during a request, soft delete
- config slot expansion, the missing-variable error, deep-merged overrides
- cache round trip, expiry, `@cached`
- migrations: `alembic upgrade head` on a fresh SQLite engine passed through `config.attributes["engine"]`, then `alembic.command.check`, which fails when models and migrations have drifted

Test-only models must use their own `DeclarativeBase`, not the app's `Base`, or the drift check will see them.

## 12. Checks

```bash
uv sync
uv run alembic revision --autogenerate -m "create users"   # only when building from scratch
uv run alembic upgrade head
uv run pytest
uv run python app.py    # then open / and confirm the status card fills in
```
