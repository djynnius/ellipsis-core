from flask import Blueprint, jsonify, render_template
from sqlalchemy import text

from controllers.cache import cache
from controllers.database import db_session

blueprint = Blueprint("home", __name__)


@blueprint.get("/")
def index():
    return render_template("home/index.html")


@blueprint.get("/api/status")
def status():
    """Health of the pieces elipsis wires together. The home page loads this with fetch."""
    try:
        db_session.execute(text("SELECT 1"))
        database = True
    except Exception:
        database = False
    return jsonify(database=database, redis=cache.ping())
