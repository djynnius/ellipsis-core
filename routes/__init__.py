"""Routes. One module per route, each exposing a Flask blueprint named `blueprint`.

A route called `business` is routes/business.py and renders templates from
views/business/. `register_blueprints` (called from app.py) picks up every
module in this folder, so a new route needs no extra wiring.
"""

import importlib
import pkgutil

from flask import Blueprint


def register_blueprints(app):
    for module_info in sorted(pkgutil.iter_modules(__path__), key=lambda info: info.name):
        module = importlib.import_module(f"{__name__}.{module_info.name}")
        blueprint = getattr(module, "blueprint", None)
        if isinstance(blueprint, Blueprint):
            app.register_blueprint(blueprint)
