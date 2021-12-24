import secrets
from dataclasses import asdict
from uuid import UUID

from quart import (Blueprint, flash, jsonify, redirect, render_template,
                   request, url_for)

from ..config import get_settings
from ..database import crud
from ..helpers.exporter import export_v1
from ..helpers.file import delete_notebook_folder
from ..helpers.route import (admin_authenticated, admin_login,
                             admin_login_required, admin_logout,
                             get_ws_handler)

blueprint = Blueprint("admin", __name__)


@blueprint.route("/")
async def index():
    if not admin_authenticated():
        return redirect(url_for(".login"))
    return await render_template("/admin/index.jinja2")


@blueprint.route("/login", methods=["GET", "POST"])
async def login():
    if get_settings().ADMIN_LOGIN_ALLOWED:
        if admin_authenticated():
            return redirect(url_for(".index"))
        if request.method == "POST":
            password = (await request.form).get("password")
            if secrets.compare_digest(password, get_settings().ADMIN_PASSWORD):
                admin_login()
                return redirect(url_for(".index"))
            await flash("admin login failed", "error")
        return await render_template("/admin/login.jinja2")
    await flash("admin login has been disabled", "error")
    return redirect(url_for("home.index"))


@blueprint.route("/logout")
@admin_login_required
async def logout():
    admin_logout()
    await flash("logged out of admin", "ok")
    return redirect(url_for("home.index"))


@blueprint.route("/change-password", methods=["GET", "POST"])
@admin_login_required
async def change_user_password():
    if request.method == "POST":
        new_password = (await request.form)["new-password"]
        new_password_conf = (await request.form)["new-password-conf"]
        user_uuid = UUID((await request.form)["user-uuid"])
        if new_password != new_password_conf:
            await flash("new passwords do not match", "error")
        else:
            await crud.modify_user_password(user_uuid, new_password)
            await flash("password changed", "ok")
            return redirect(url_for(".index"))
    users = await crud.get_users()
    return await render_template("/admin/change-password.jinja2", users=users)


@blueprint.route("/delete-user", methods=["GET", "POST"])
@admin_login_required
async def delete_user():
    if request.method == "POST":
        user_uuid = UUID((await request.form)["user-uuid"])
        for notebook in (await crud.get_all_personal_notebooks(user_uuid)):
            delete_notebook_folder(notebook.uuid)
        await crud.delete_user(user_uuid)
        await flash("user deleted", "ok")
    users = await crud.get_users()
    return await render_template("/admin/delete-user.jinja2", users=users)


@blueprint.route("/stats")
@admin_login_required
async def stats():
    context = {
        "note_count": await crud.count_notes(),
        "notebook_count": await crud.count_notebooks(),
        "user_count": await crud.count_users(),
        "ws_clients_count": get_ws_handler().clients_count,
    }
    return await render_template("/admin/stats.jinja2", **context)


@blueprint.route("/users")
@admin_login_required
async def user_list():
    users = await crud.get_users()
    return await render_template("/admin/users.jinja2", users=users)


@blueprint.route("/export/v1/meta")
@admin_login_required
async def export_v1_meta():
    export = await export_v1()
    return jsonify(asdict(export))
