from quart import Blueprint, render_template, redirect, url_for
from quart_auth import current_user

blueprint = Blueprint("home", __name__)

@blueprint.route("/")
async def index():
    if await current_user.is_authenticated:
        return redirect(url_for("personal_home.index"))
    return await render_template("/home/index.jinja2")
