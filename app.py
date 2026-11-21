"""elipsis base app. Run with `python app.py` or `flask run`."""

from flask import Flask, render_template, session

from controllers.cache import cache
from controllers.config import BASE_DIR, load_config
from controllers.database import init_db
from models import set_actor
from routes import register_blueprints

# Socket.IO is baked in but off. To turn it on: uncomment the lines marked
# "socketio" here, the dependency in pyproject.toml and the script tag in views/base.html.
# from flask_socketio import SocketIO
# socketio = SocketIO()


def create_app(config_overrides=None):
    config = load_config(overrides=config_overrides)

    app = Flask(__name__, template_folder="views", static_folder="assets", static_url_path="/assets")
    app.config["ELIPSIS"] = config
    app.config["SECRET_KEY"] = config["app"]["secret_key"]
    app.config["DEBUG"] = bool(config["app"].get("debug", False))

    storage = config.get("storage", {})
    app.config["UPLOAD_FOLDER"] = str(BASE_DIR / storage.get("uploads", "uploads"))
    app.config["DOWNLOAD_FOLDER"] = str(BASE_DIR / storage.get("downloads", "downloads"))
    app.config["MAX_CONTENT_LENGTH"] = int(storage.get("max_upload_mb", 16)) * 1024 * 1024

    init_db(app)
    cache.init_app(app)  # Redis cache and, when enabled, Redis-backed sessions
    register_blueprints(app)
    # socketio.init_app(app, message_queue=config.get("socketio", {}).get("message_queue"))

    @app.before_request
    def remember_actor():
        # Fills created_by / updated_by on models. Set session["user_id"] at login.
        set_actor(session.get("user_id"))

    @app.context_processor
    def template_globals():
        return {"app_name": config["app"]["name"]}

    @app.errorhandler(404)
    def not_found(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(error):
        return render_template("errors/500.html"), 500

    return app


if __name__ == "__main__":
    app = create_app()
    settings = app.config["ELIPSIS"]["app"]
    app.run(host=settings.get("host", "127.0.0.1"), port=int(settings.get("port", 5000)))
    # socketio.run(app, host=..., port=...)   # replaces app.run when Socket.IO is on
