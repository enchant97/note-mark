import logging

from quart import Quart, flash, redirect, url_for
from quart_auth import AuthManager, Unauthorized
from tortoise.contrib.quart import register_tortoise

from . import __version__
from .config import get_settings
from .database import models
from .helpers.websocket.handler import MessageQueueHandler
from .views import account, admin, api, auth, home, personal_home, share_link

app = Quart(__name__)
auth_manager = AuthManager()


@app.errorhandler(Unauthorized)
async def redirect_to_login(*_):
    await flash("You need to be logged in to view this page", "error")
    return redirect(url_for("home.index"))


def create_app():
    # setup logging
    logging.basicConfig(
        level=logging.getLevelName(get_settings().LOG_LEVEL))
    # do config
    app.config["__VERSION__"] = __version__
    app.secret_key = get_settings().SECRET_KEY
    app.config["QUART_AUTH_COOKIE_SECURE"] = get_settings().AUTH_COOKIE_SECURE
    app.config["SERVER_NAME"] = get_settings().SERVER_NAME

    # register non-config variables
    app.config["WS_CLIENTS"] = MessageQueueHandler(get_settings().MAX_QUEUE_SIZE)

    # register route blueprints
    app.register_blueprint(home.blueprint, url_prefix="/")
    app.register_blueprint(admin.blueprint, url_prefix="/admin")
    app.register_blueprint(auth.blueprint, url_prefix="/auth")
    app.register_blueprint(personal_home.blueprint, url_prefix="/home")
    app.register_blueprint(account.blueprint, url_prefix="/home/account")
    app.register_blueprint(share_link.blueprint, url_prefix="/share-link")
    app.register_blueprint(api.blueprint, url_prefix="/api")
    # database setup
    register_tortoise(
        app,
        db_url=get_settings().DB_URL,
        modules={"models": [models]},
        generate_schemas=True)
    # init quart extentions
    auth_manager.init_app(app)
    return app
