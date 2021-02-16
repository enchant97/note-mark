import logging

from quart import Quart
from quart_auth import AuthManager
from tortoise.contrib.quart import register_tortoise

from . import __version__
from .config import get_settings
from .database import models

BASE_URL = get_settings().BASE_URL
if BASE_URL == "/":
    BASE_URL = ""

app = Quart(__name__, static_url_path=BASE_URL + "/static")
auth_manager=AuthManager()


def create_app():
    logging.basicConfig(
        level=logging.getLevelName(get_settings().LOG_LEVEL))
    app.config["__VERSION__"] = __version__
    app.secret_key = get_settings().SECRET_KEY
    app.config["QUART_AUTH_COOKIE_SECURE"] = get_settings().AUTH_COOKIE_SECURE

    register_tortoise(
    app,
    db_url=get_settings().DB_URL,
    modules={"models": [models]},
    generate_schemas=True)

    auth_manager.init_app(app)

    return app
