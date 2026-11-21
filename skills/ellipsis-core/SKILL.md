---
name: ellipsis-core
description: Scaffold and build Python Flask apps on the ellipsis structure (Flask blueprints, plain SQLAlchemy, Alembic, Jinja2 views, Vue.js, skeleton.js loading placeholders, Redis sessions and cache, config.yaml, pytest). Use when the user runs /ellipsis-core, asks for an "ellipsis app" (including the misspelling "elipsis"), wants a new Flask app in their standard layout, or is adding routes, models, views or migrations to an app that already follows this layout.
---

# ellipsis

ellipsis is the user's standard structure for Flask apps. It exists as a git repository (the scaffold itself) and as this skill. Your job is either to start a new app from the scaffold or to extend an existing ellipsis app without breaking its conventions.

An existing ellipsis app is recognisable by `app.py`, `config.yaml`, and the folders `routes/`, `views/`, `controllers/`, `models/`, `migration/` side by side. If you are in one, skip to "Building in an ellipsis app".

## Starting a new app

Ask for the app name and target folder only if the request does not make them clear. Then get the scaffold from the first source that works:

1. **The git repository.** If `ELLIPSIS_REPO` is set, run `git clone --depth 1 "$ELLIPSIS_REPO" <target>`. This is the preferred source because it is the most current.
2. **A local checkout.** This skill is often a symlink into a checkout of the repository. Resolve this skill folder's real path; if two levels up there is an `app.py` and a `config.yaml`, copy that folder to the target, leaving out `.git`, `.venv`, `.env`, `__pycache__`, `.pytest_cache` and the contents of `databases/`, `uploads/` and `downloads/` other than their `.gitignore`.
3. **From scratch.** With no repository and no checkout, build the structure yourself from `references/architecture.md`, which describes every file and its contract. Read it in full first. Fetch Vue from `https://unpkg.com/vue@3/dist/vue.global.prod.js` into `assets/scripts/vendor/`; if there is no network at all, leave a note in the README that the file must be added and carry on.

If `ELLIPSIS_REPO` is not set and you fell through to 2 or 3, say so in your final message so the user can set it.

After the files are in place:

1. Remove what belongs to the scaffold rather than the new app: `.git/`, `.github/`, `skills/`, `ellipsis-core-site/` and `ellipsis.md`. Keep `uv.lock`.
2. Set the app name in `config.yaml` (`app.name`) and `pyproject.toml` (`name`), and retitle `README.md` for the new app while keeping its structure tree and conventions sections.
3. Copy `.env.example` to `.env` and put a fresh secret in it: `python -c "import secrets; print(secrets.token_hex(32))"`.
4. `git init`, then install: `uv sync` (or, when uv is absent, `python -m venv .venv && .venv/bin/pip install -r requirements.txt`, and run the commands below from `.venv/bin/` instead of through `uv run`).
5. `uv run alembic upgrade head`, then `uv run pytest`. Both must succeed before you build anything on top.

Then build what the user asked for, following the rules below.

## Building in an ellipsis app

The layout is the point of ellipsis, so keep to it even when another arrangement seems tidier. `AGENTS.md` in the app repeats these rules for agents that do not have this skill.

**Routes.** One file per route in `routes/`, exposing `blueprint = Blueprint("<name>", __name__, url_prefix="/<name>")`. `routes/__init__.py` registers every module automatically, so do not touch `app.py` to add a route. JSON endpoints for a page live in the same route file.

**Views.** Templates for route `<name>` go in `views/<name>/`. They extend `views/base.html`, except pages meant to look entirely different (login, landing), which may stand alone but must still load `skeleton.css`, Vue, `skeleton.js` and `app.js`. Anything used by more than one template is a macro or include in `views/elements/`.

**Controllers.** Shared functions and classes go in `controllers/`. There is no helpers, utils, services or factories folder, and you should not create one.

**Models.** One file per model in `models/`, imported in `models/__init__.py` (Alembic only sees imported models). Inherit `StandardColumns` so the table has `id`, `uuid`, `created_at`, `updated_at`, `created_by`, `updated_by`; they fill themselves in. Leave the mixin off only when the table cannot fill those columns, such as a pure association table. Add `SoftDelete` (`deleted_at`, `deleted_by`) only when the user wants rows to be recoverable. Query through `controllers.database.db_session` with SQLAlchemy 2.0 style (`select(...)`). Never add Flask-SQLAlchemy.

**Migrations.** Every schema change goes through Alembic: `uv run alembic revision --autogenerate -m "<what changed>"`, read the generated file, then `uv run alembic upgrade head`. Never call `Base.metadata.create_all` outside tests. `unit_tests/test_controllers.py` fails when models and migrations drift apart, which is your reminder to generate one.

**Config.** Settings go in `config.yaml` and are read from `app.config["ELLIPSIS"]`. Secrets and per-machine values go in `.env` and appear in `config.yaml` as `${VAR}` or `${VAR:default}`; add new variables to `.env.example` too.

**Front end.** Vue is loaded globally by `base.html`. Mount with `Ellipsis.createApp({...}).mount("#app")`, which sets the delimiters to `[[ ]]` (Jinja owns `{{ }}`) and registers `v-skeleton`. Put `v-cloak` on the mount element. Page-specific scripts go in `{% block scripts %}` or a file in `assets/scripts/`; styles in `assets/css/`; icon fonts in `assets/fonts/`.

**Loading states.** Nothing slow may render as a blank gap:

- Every `<img>` gets `data-skeleton` and an explicit `width` and `height`.
- Every section filled by a fetch shows a skeleton while it waits: `<div v-if="loading">{{ skeleton.lines(3) }}</div>` or `v-skeleton="loading"` on the real element. The `skeleton` macros (`lines`, `card`, `block`, `page`) are already imported in `base.html`.
- Slow navigations are covered automatically. Add `data-no-skeleton` to download links and to forms that do not leave the page.
- A page that renders empty and then loads everything sets `{% block body_attrs %}data-page-loading{% endblock %}` and calls `Skeleton.pageReady()` when its data is in. Override `{% block page_skeleton %}` when the default shape is far from the real page.

**Redis.** Sessions and cache go through `controllers/cache.py` (`cache.get`, `cache.set`, `cache.delete`, `@cached(ttl=...)`). Keep nothing in module-level variables that a second instance behind a load balancer would need. Set `session["user_id"]` at login; that value is what fills `created_by` and `updated_by`.

**Socket.IO.** Present but commented out. Enable it only when the feature needs it, by uncommenting the marked lines in `pyproject.toml`, `app.py` and `views/base.html`, and point its `message_queue` at Redis.

**Uploads and downloads.** Save uploaded files under `app.config["UPLOAD_FOLDER"]` and generated files under `app.config["DOWNLOAD_FOLDER"]`. Pass user-supplied filenames through `werkzeug.utils.secure_filename` and serve with `send_from_directory`.

**Tests.** ellipsis apps are unit tested rigorously. Each route, model and controller you add gets tests in `unit_tests/`, using the `app` and `client` fixtures in `conftest.py`. Run `uv run pytest` and report the real result.

## Reference

`references/architecture.md` has the full tree and the contract of every scaffold file. Read it when building from scratch, or when you need to know exactly how a scaffold file behaves before changing it.
