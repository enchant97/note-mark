from quart import Blueprint, render_template

blueprint = Blueprint("home", __name__)

@blueprint.route("/")
async def index():
    return await render_template("/home/index.jinja2")
