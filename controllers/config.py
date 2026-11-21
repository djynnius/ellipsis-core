"""Loads config.yaml, filling ${VAR} / ${VAR:default} slots from the environment."""

import os
import re
from pathlib import Path

import yaml
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

_ENV_SLOT = re.compile(r"\$\{(\w+)(?::([^}]*))?\}")


def _expand(value):
    if isinstance(value, dict):
        return {key: _expand(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_expand(item) for item in value]
    if not isinstance(value, str) or "${" not in value:
        return value

    def replace(match):
        name, default = match.group(1), match.group(2)
        if name in os.environ:
            return os.environ[name]
        if default is None:
            raise KeyError(f"config.yaml needs the environment variable {name}")
        return default

    expanded = _ENV_SLOT.sub(replace, value)
    # A value that was only a slot gets its YAML type back ("false" -> False, "5000" -> 5000).
    return yaml.safe_load(expanded) if _ENV_SLOT.fullmatch(value) else expanded


def _merge(base, overrides):
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            _merge(base[key], value)
        else:
            base[key] = value
    return base


def load_config(path=None, overrides=None):
    """Return the config as a dict. `overrides` is deep-merged on top (used by tests)."""
    load_dotenv(BASE_DIR / ".env")
    path = Path(path or os.environ.get("ELLIPSIS_CONFIG") or BASE_DIR / "config.yaml")
    with open(path, encoding="utf-8") as handle:
        config = _expand(yaml.safe_load(handle) or {})
    return _merge(config, overrides or {})
