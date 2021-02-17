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


@blueprint.route("/notebook/<notebook_uuid>")
@login_required
async def get_notebook(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        notebook = await crud.get_personal_notebook(notebook_uuid)
        users = await crud.get_users()
        scope = await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "owner"))
        notes = await crud.get_notes(notebook_uuid)
        return await render_template(
            "/personal-home/notebook/view.jinja2",
            scope=scope,
            notebook=notebook,
            users=users,
            notes=notes)
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
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("writer", "owner"))
        await crud.delete_notebook(notebook_uuid)
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
        await crud.check_user_notebook_access(owner_id, notebook_uuid, ("owner",))
        await crud.create_notebook_user_share(
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


@blueprint.route("/notebook/<notebook_uuid>/notes/new", methods=["GET", "POST"])
@login_required
async def new_note(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        if request.method == "POST":
            prefix = (await request.form)["prefix"]
            await crud.check_user_notebook_access(owner_id, notebook_uuid, ("write", "owner"))
            note = await crud.create_note(notebook_uuid, prefix)
            await flash("note create", "ok")
            return redirect(
                url_for(
                    ".view_note",
                    notebook_uuid=notebook_uuid,
                    note_uuid=note.uuid))
        return await render_template(
            "/personal-home/note/create.jinja2",
            notebook_uuid=notebook_uuid)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook/user uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/view")
@login_required
async def view_note(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(owner_id, notebook_uuid, ("read", "owner"))
        note = await crud.get_note(note_uuid)
        return await render_template(
            "/personal-home/note/view.jinja2",
            note=note)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook/user/note", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/edit", methods=["GET", "POST"])
@login_required
async def edit_mode(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        if request.method == "POST":
            pass
        await crud.check_user_notebook_access(owner_id, notebook_uuid, ("write", "owner"))
        note = await crud.get_note(note_uuid)
        return await render_template("/personal-home/note/edit.jinja2", note=note)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook/user/note", "error")
    return redirect(url_for(".index"))
