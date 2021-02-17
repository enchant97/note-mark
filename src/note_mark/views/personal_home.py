from uuid import UUID

from quart import Blueprint, flash, redirect, render_template, request, url_for
from quart_auth import current_user, login_required
from tortoise.exceptions import DoesNotExist, IntegrityError

from ..database import crud

blueprint = Blueprint("personal_home", __name__)

@blueprint.route("/")
@login_required
async def index():
    owner_id = UUID(current_user.auth_id)
    owned_notebooks = await crud.get_all_personal_notebooks(owner_id)
    shared_notebooks = crud.get_shared_notebooks(owner_id)
    return await render_template(
        "/personal-home/index.jinja2",
        owned_notebooks=owned_notebooks,
        shared_notebooks=shared_notebooks)


@blueprint.route("/notebook/new", methods=["GET", "POST"])
@login_required
async def new_notebook():
    if request.method == "POST":
        try:
            prefix = (await request.form)['prefix']
            owner_id = UUID(current_user.auth_id)
            created_notebook = await crud.create_notebook(owner_id, prefix)
            return redirect(url_for(".get_notebook", notebook_uuid=created_notebook.uuid))
        except KeyError:
            await flash("required fields missing", "error")

    return await render_template("/personal-home/notebook/create.jinja2")


@blueprint.route("/notebook/shared/<notebook_uuid>")
@login_required
async def get_shared_notebook(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        curr_user_id = UUID(current_user.auth_id)
        notebook, has_write = await crud.get_shared_notebook(curr_user_id, notebook_uuid)
        return await render_template(
            "/personal-home/notebook/view.jinja2",
            notebook=notebook,
            is_owner=False,
            has_write=has_write)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>")
@login_required
async def get_notebook(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        notebook = await crud.get_personal_notebook(owner_id, notebook_uuid)
        users = await crud.get_users()
        return await render_template(
            "/personal-home/notebook/view.jinja2",
            is_owner=True,
            notebook=notebook,
            users=users)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/delete", methods=["GET"])
@login_required
async def delete_notebook(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.delete_notebook(owner_id, notebook_uuid)
        await flash("notebook deleted", "ok")
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook uuid", "error")
    return redirect(url_for(".index"))

@blueprint.route("/notebook/<notebook_uuid>/share-user", methods=["POST"])
@login_required
async def add_user_share(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        user_uuid = UUID((await request.form)["user_uuid"])
        write_access = (await request.form).get("write_access", False, bool)
        await crud.create_notebook_user_share(
            owner_id,
            notebook_uuid,
            user_uuid,
            write_access)
        await flash(f"shared notebook")
        return redirect(url_for(".get_notebook", notebook_uuid=notebook_uuid.hex))
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except IntegrityError:
        await flash("notebook already shared with that user", "error")
    except ValueError:
        await flash("invalid notebook/user uuid", "error")
    return redirect(url_for(".index"))
