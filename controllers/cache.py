"""Redis: shared cache and server-side sessions.

Sessions and cached values live in Redis so that every instance behind a load
balancer sees the same state. With `redis.enabled: false` the cache falls back
to process memory and sessions to Flask's signed cookies (single instance only).

    from controllers.cache import cache, cached

    cache.set("report:42", data, ttl=60)

    @cached(ttl=120)
    def expensive(business_id): ...
"""

import functools
import json
import time
from datetime import timedelta

import redis


class Cache:
    """JSON cache with the same interface whether Redis is on or off."""

    def __init__(self):
        self.client = None  # redis.Redis when enabled
        self.prefix = ""
        self.default_ttl = 300
        self._memory = {}

    def init_app(self, app):
        settings = app.config["ELLIPSIS"].get("redis", {})
        self.prefix = settings.get("key_prefix", "")
        self.default_ttl = int(settings.get("default_ttl", 300))
        self._memory = {}
        self.client = None
        if not settings.get("enabled"):
            return

        self.client = redis.Redis.from_url(settings["url"])

        from flask_session import Session

        app.config.update(
            SESSION_TYPE="redis",
            SESSION_REDIS=self.client,
            SESSION_KEY_PREFIX=f"{self.prefix}session:",
            SESSION_PERMANENT=True,
            PERMANENT_SESSION_LIFETIME=timedelta(seconds=int(settings.get("session_lifetime", 86400))),
        )
        Session(app)

    def get(self, key, default=None):
        key = self.prefix + key
        if self.client is not None:
            raw = self.client.get(key)
            return default if raw is None else json.loads(raw)
        value, expires_at = self._memory.get(key, (None, 0))
        if expires_at and expires_at < time.monotonic():
            self._memory.pop(key, None)
            return default
        return default if value is None else json.loads(value)

    def set(self, key, value, ttl=None):
        key = self.prefix + key
        ttl = self.default_ttl if ttl is None else ttl
        raw = json.dumps(value, default=str)
        if self.client is not None:
            self.client.set(key, raw, ex=ttl or None)
        else:
            self._memory[key] = (raw, time.monotonic() + ttl if ttl else 0)

    def delete(self, key):
        key = self.prefix + key
        if self.client is not None:
            self.client.delete(key)
        else:
            self._memory.pop(key, None)

    def ping(self):
        """True when Redis answers, False when it does not, None when disabled."""
        if self.client is None:
            return None
        try:
            return bool(self.client.ping())
        except redis.RedisError:
            return False


cache = Cache()


def cached(ttl=None, key=None):
    """Cache a function's JSON-serialisable return value, keyed by its arguments."""

    def decorator(function):
        @functools.wraps(function)
        def wrapper(*args, **kwargs):
            cache_key = key or f"{function.__module__}.{function.__qualname__}:{args!r}:{sorted(kwargs.items())!r}"
            hit = cache.get(cache_key)
            if hit is not None:
                return hit
            result = function(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result

        return wrapper

    return decorator
