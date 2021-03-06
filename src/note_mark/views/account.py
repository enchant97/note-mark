from uuid import UUID

from quart import Blueprint, flash, redirect, render_template, request, url_for
from quart_auth import current_user, login_required, logout_user
from tortoise.exceptions import IntegrityError

from ..database import crud
from ..helpers.file import delete_notebook_folder

blueprint = Blueprint("account", __name__)


@blueprint.route("/")
@login_required
async def index():
    return await render_template("/personal-home/account/index.jinja2")


@blueprint.route("/change-password", methods=["GET", "POST"])
@login_required
async def change_password():
    if request.method == "POST":
        new_password = (await request.form)["new-password"]
        new_password_conf = (await request.form)["new-password-conf"]
        if new_password != new_password_conf:
            await flash("new passwords do not match", "error")
        else:
            await crud.modify_user_password(UUID(current_user.auth_id), new_password)
            await flash("password changed", "ok")
            return redirect(url_for(".index"))
    return await render_template("/personal-home/account/change_password.jinja2")


@blueprint.route("/change-username", methods=["GET", "POST"])
@login_required
async def change_username():
    if request.method == "POST":
        try:
            username = (await request.form)["new-username"]
            await crud.modify_user_username(UUID(current_user.auth_id), username)
            await flash("changed username", "ok")
            return redirect(url_for(".index"))
        except IntegrityError:
            await flash("username already taken", "error")
        except KeyError:
            await flash("missing required params", "error")
    return await render_template("/personal-home/account/change_username.jinja2")


@blueprint.route("/delete")
@login_required
async def delete():
    owner_uuid = UUID(current_user.auth_id)
    for notebook in (await crud.get_all_personal_notebooks(owner_uuid)):
        delete_notebook_folder(notebook.uuid)
    await crud.delete_user(owner_uuid)
    logout_user()
    await flash("deleted account", "ok")
    return redirect(url_for("home.index"))
