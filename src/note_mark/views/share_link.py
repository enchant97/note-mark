from uuid import UUID

from quart import Blueprint, flash, redirect, render_template, request, url_for
from tortoise.exceptions import DoesNotExist

from ..database import crud
from ..helpers.file import (read_note_file_html, read_note_file_md,
                            write_note_file_md)
from ..helpers.types import datetime_input_type

blueprint = Blueprint("share_link", __name__)


@blueprint.route("/")
async def index():
    return await render_template("/share-link/index.jinja2")


@blueprint.route("/use_code", methods=["POST"])
async def use_code():
    share_link_uuid = (await request.form)["code-uuid"]
    return redirect(url_for(".get_notebook", share_link_uuid=share_link_uuid))


@blueprint.route("/<share_link_uuid>/notebook")
async def get_notebook(share_link_uuid):
    try:
        share_link_uuid = UUID(share_link_uuid)
        scope = await crud.check_share_link_access(
            share_link_uuid,
            ("read", "write"))
        notebook = await crud.get_notebook_by_link_share(share_link_uuid)
        notes = await crud.get_notes(notebook.uuid)
        return await render_template(
            "/share-link/notebook/view.jinja2",
            scope=scope,
            notebook=notebook,
            share_link_uuid=share_link_uuid,
            notes=notes)
    except DoesNotExist:
        await flash("notebook does not exist, or you don't have access to it", "error")
    except ValueError:
        await flash("invalid share-link uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/<share_link_uuid>/notes/new", methods=["GET", "POST"])
async def new_note(share_link_uuid):
    try:
        share_link_uuid = UUID(share_link_uuid)
        await crud.check_share_link_access(
            share_link_uuid,
            ("write",))
        notebook = await crud.get_notebook_by_link_share(share_link_uuid)
        if request.method == "POST":
            prefix = (await request.form)["prefix"]
            note = await crud.create_note(notebook.uuid, prefix)
            await write_note_file_md(notebook.uuid, note.uuid)
            await flash("note create", "ok")
            return redirect(
                url_for(
                    ".view_note",
                    share_link_uuid=share_link_uuid,
                    note_uuid=note.uuid))
        return await render_template(
            "/share-link/note/create.jinja2",
            share_link_uuid=share_link_uuid)
    except DoesNotExist:
        await flash("share-link does not exist,\
            or you don't have permission for the current page", "error")
    except ValueError:
        await flash("invalid share-link uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/<share_link_uuid>/notes/<note_uuid>/view")
async def view_note(share_link_uuid, note_uuid):
    try:
        share_link_uuid = UUID(share_link_uuid)
        scope = await crud.check_share_link_access(
            share_link_uuid,
            ("read", "write"))

        note_uuid = UUID(note_uuid)
        note = await crud.get_note(note_uuid)
        notebook_uuid = (await crud.get_notebook_by_link_share(share_link_uuid)).uuid
        content = await read_note_file_html(notebook_uuid, note_uuid)
        return await render_template(
            "/share-link/note/view.jinja2",
            note=note,
            share_link_uuid=share_link_uuid,
            content=content,
            scope=scope)
    except DoesNotExist:
        await flash("share-link does not exist,\
            or you don't have permission for the current page", "error")
    except ValueError:
        await flash("invalid share-link uuid", "error")
    return redirect(url_for(".index"))


@blueprint.route("/<share_link_uuid>/notes/<note_uuid>/edit", methods=["GET", "POST"])
async def edit_note(share_link_uuid, note_uuid):
    try:
        share_link_uuid = UUID(share_link_uuid)
        await crud.check_share_link_access(
            share_link_uuid,
            ("write",))

        note_uuid = UUID(note_uuid)
        notebook_uuid = (await crud.get_notebook_by_link_share(share_link_uuid)).uuid
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
                await note.save()  # mark the note updated
                await flash("note saved, but conflict was detected", "ok")
            else:
                # no conflict detected
                await write_note_file_md(notebook_uuid, note_uuid, updated_content)
                await note.save()  # mark the note updated
                await flash("note saved", "ok")

        content = await read_note_file_md(notebook_uuid, note_uuid)
        return await render_template(
            "/share-link/note/edit.jinja2",
            note=note,
            share_link_uuid=share_link_uuid,
            content=content)
    except DoesNotExist:
        await flash("share-link does not exist,\
            or you don't have permission for the current page", "error")
    except ValueError:
        await flash("invalid share-link uuid", "error")
    return redirect(url_for(".index"))
