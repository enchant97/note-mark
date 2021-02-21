from uuid import UUID

from quart import Blueprint, flash, redirect, render_template, request, url_for
from quart_auth import current_user, login_required
from tortoise.exceptions import DoesNotExist, IntegrityError

from ..database import crud
from ..helpers import (datetime_input_type, delete_note_file,
                       delete_notebook_folder, read_note_file_html,
                       read_note_file_md, write_note_file_md)

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
        scope = await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        notes = await crud.get_notes(notebook_uuid)
        return await render_template(
            "/personal-home/notebook/view.jinja2",
            scope=scope,
            notebook=notebook,
            notes=notes)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/rename", methods=["GET", "POST"])
@login_required
async def rename_notebook(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("owner",))
        if request.method == "POST":
            new_prefix = (await request.form)["prefix"]
            await crud.rename_notebook(notebook_uuid, new_prefix)
            await flash("notebook renamed", "ok")
            return redirect(url_for(".get_notebook", notebook_uuid=notebook_uuid))
        return await render_template(
            "personal-home/notebook/rename.jinja2",
            notebook_uuid=notebook_uuid)
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
            ("owner",))
        await crud.delete_notebook(notebook_uuid)
        delete_notebook_folder(notebook_uuid)
        await flash("notebook deleted", "ok")
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/share-user", methods=["GET", "POST"])
@login_required
async def user_share(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(owner_id, notebook_uuid, ("owner",))
        if request.method == "POST":
            user_uuid = UUID((await request.form)["user_uuid"])
            write_access = (await request.form).get("write_access", False, bool)
            await crud.create_notebook_user_share(
                notebook_uuid,
                user_uuid,
                write_access)
            await flash("shared notebook", "ok")
        users = await crud.get_users()
        user_shares = await crud.get_user_shares_by_notebook(notebook_uuid)
        return await render_template(
            "/personal-home/notebook/shares/share-users.jinja2",
            users=users,
            notebook_uuid=notebook_uuid,
            user_shares=user_shares)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except IntegrityError:
        await flash("notebook already shared with that user", "error")
    except ValueError:
        await flash("invalid notebook/user uuid", "error")
    return redirect(url_for(".get_notebook", notebook_uuid=notebook_uuid))


@blueprint.route("/notebook/<notebook_uuid>/share-link", methods=["GET", "POST"])
@login_required
async def share_link(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(owner_id, notebook_uuid, ("owner",))
        if request.method == "POST":
            write_access = (await request.form).get("write_access", False, bool)
            expiry = (await request.form).get("expiry", None, datetime_input_type)
            share = await crud.create_notebook_link_share(
                notebook_uuid,
                write_access,
                expiry)
            await flash(f"shared notebook: {share.uuid}", "ok")
        link_shares = await crud.get_link_shares_by_notebook(notebook_uuid)
        return await render_template(
            "/personal-home/notebook/shares/share-links.jinja2",
            notebook_uuid=notebook_uuid,
            link_shares=link_shares)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook/user uuid", "error")
    return redirect(url_for(".get_notebook", notebook_uuid=notebook_uuid))


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
            await write_note_file_md(notebook_uuid, note.uuid)
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
        scope = await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        note = await crud.get_note(note_uuid)
        content = await read_note_file_html(notebook_uuid, note_uuid)
        return await render_template(
            "/personal-home/note/view.jinja2",
            note=note,
            content=content,
            scope=scope)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook/user/note", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/rename", methods=["GET", "POST"])
@login_required
async def rename_note(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("owner",))
        if request.method == "POST":
            new_prefix = (await request.form)["prefix"]
            await crud.rename_note(note_uuid, new_prefix)
            await flash("note renamed", "ok")
            return redirect(url_for(".get_notebook", notebook_uuid=notebook_uuid))
        return await render_template(
            "personal-home/note/rename.jinja2",
            notebook_uuid=notebook_uuid,
            note_uuid=note_uuid)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/edit", methods=["GET", "POST"])
@login_required
async def edit_note(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(owner_id, notebook_uuid, ("write", "owner"))
        note = await crud.get_note(note_uuid)

        if request.method == "POST":
            updated_content = (await request.form)["content"]
            updated_at = (await request.form)["updated_at"]
            updated_at = datetime_input_type(updated_at, "%Y-%m-%d %H:%M:%S.%f%z")

            if updated_at < note.updated_at:
                # conflict was detected
                conflict_dt = note.updated_at.strftime("%Y-%m-%d %H:%M:%S")
                note_backup = await crud.create_note(notebook_uuid, note.prefix + conflict_dt)
                conflict_data = await read_note_file_md(notebook_uuid, note_uuid)
                await write_note_file_md(notebook_uuid, note_backup.uuid, conflict_data)
                await write_note_file_md(notebook_uuid, note_uuid, updated_content)
                await crud.mark_note_updated(note_uuid)
                await flash("note saved, but conflict was detected", "ok")
            else:
                # no conflict detected
                await write_note_file_md(notebook_uuid, note_uuid, updated_content)
                await crud.mark_note_updated(note_uuid)
                await flash("note saved", "ok")

        content = await read_note_file_md(notebook_uuid, note_uuid)
        return await render_template(
            "/personal-home/note/edit.jinja2",
            note=note,
            content=content)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid notebook/user/note", "error")
    return redirect(url_for(".index"))


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/delete", methods=["GET"])
@login_required
async def delete_note(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("owner",))
        await crud.delete_note(note_uuid)
        delete_note_file(notebook_uuid, note_uuid)
        await flash("note deleted", "ok")
        return redirect(url_for(".get_notebook", notebook_uuid=notebook_uuid))
    except DoesNotExist:
        await flash("note does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid note uuid", "error")
    return redirect(url_for(".index"))
