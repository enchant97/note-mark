from quart import Blueprint, flash, redirect, render_template, request, url_for
from quart_auth import current_user, AuthUser, login_user, logout_user, login_required
from ..database import crud
from tortoise.exceptions import IntegrityError
from ..config import get_settings

blueprint = Blueprint("auth", __name__)


@blueprint.route("/login", methods=["GET", "POST"])
async def login():
    if await current_user.is_authenticated:
        return redirect(url_for("home.index"))

    if request.method == "POST":
        username = (await request.form)['username']
        password = (await request.form).get('password', '')
        user = await crud.check_user(username, password)
        if user:
            login_user(AuthUser(user.uuid.hex))
            return redirect(url_for("home.index"))
        await flash("username or password incorrect", "red")

    return await render_template("/auth/login.jinja2")


@blueprint.route("/logout")
@login_required
async def logout():
    logout_user()
    await flash("You have been logged out", "ok")
    return redirect(url_for("home.index"))


@blueprint.route("/signup", methods=["GET", "POST"])
async def signup():
    if not get_settings().ALLOW_ACCOUNT_CREATION:
        await flash("signups currently disabled", "error")
        return redirect(url_for("home.index"))
    elif await current_user.is_authenticated:
        return redirect(url_for("home.index"))

    if request.method == "POST":
        try:
            username = (await request.form)["username"]
            password = (await request.form)["password"]
            await crud.create_user(username, password)
            return redirect(url_for("home.index"))
        except IntegrityError:
            await flash("username already exists", "error")
        except KeyError:
            await flash("required fields missing", "error")

    return await render_template("/auth/signup.jinja2")
