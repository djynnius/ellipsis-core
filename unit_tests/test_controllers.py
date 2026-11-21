import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from controllers.cache import Cache, cache, cached
from controllers.config import BASE_DIR, load_config


def write_config(tmp_path, text):
    path = tmp_path / "config.yaml"
    path.write_text(text)
    return path


def test_config_fills_slots_from_the_environment(tmp_path, monkeypatch):
    monkeypatch.setenv("TEST_PORT", "8123")
    path = write_config(tmp_path, "app:\n  port: ${TEST_PORT:5000}\n  debug: ${TEST_UNSET_DEBUG:false}\n  url: http://${TEST_PORT}/x\n")
    config = load_config(path)
    assert config["app"] == {"port": 8123, "debug": False, "url": "http://8123/x"}


def test_config_requires_slots_without_defaults(tmp_path, monkeypatch):
    monkeypatch.delenv("TEST_MISSING", raising=False)
    with pytest.raises(KeyError, match="TEST_MISSING"):
        load_config(write_config(tmp_path, "app:\n  key: ${TEST_MISSING}\n"))


def test_config_overrides_are_deep_merged(tmp_path):
    path = write_config(tmp_path, "app:\n  name: a\n  port: 1\n")
    assert load_config(path, {"app": {"port": 2}})["app"] == {"name": "a", "port": 2}


def test_cache_round_trip_without_redis(app):
    cache.set("k", {"n": 1})
    assert cache.get("k") == {"n": 1}
    cache.delete("k")
    assert cache.get("k", "gone") == "gone"


def test_cache_entries_expire(monkeypatch):
    memory_cache = Cache()
    now = [100.0]
    monkeypatch.setattr("controllers.cache.time.monotonic", lambda: now[0])
    memory_cache.set("k", 1, ttl=10)
    now[0] = 111.0
    assert memory_cache.get("k") is None


def test_cached_decorator_calls_the_function_once(app):
    calls = []

    @cached(ttl=60)
    def double(n):
        calls.append(n)
        return n * 2

    assert double(4) == 8 and double(4) == 8
    assert calls == [4]


def test_migrations_build_the_schema_the_models_describe(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'migrated.db'}")
    alembic_config = Config(str(BASE_DIR / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(BASE_DIR / "migration"))
    alembic_config.attributes["engine"] = engine

    command.upgrade(alembic_config, "head")
    command.check(alembic_config)  # fails if models and migrations have drifted

    assert "users" in inspect(engine).get_table_names()
