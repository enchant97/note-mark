import asyncio
from uuid import UUID

from quart import Blueprint, jsonify, make_response, render_template, request
from quart_auth import current_user
from tortoise.exceptions import DoesNotExist

from ..database import crud
from ..helpers.file import (read_note_file_html, read_note_file_md,
                            write_note_file_md)
from ..helpers.route import api_login_required, get_ws_handler
from ..helpers.types import datetime_input_type
from ..helpers.websocket.route import ws_receive, ws_send
from ..helpers.websocket.types import MessageCategory, make_message

blueprint = Blueprint("api", __name__)


@blueprint.route("/get-ws-token")
@api_login_required
async def get_ws_token():
    token = get_ws_handler().create_token(UUID(current_user.auth_id))
    return jsonify(token=token)


@blueprint.route("/notebook/personal.html")
@api_login_required
async def rendered_notebook_personal_list():
    owner_id = UUID(current_user.auth_id)
    owned_notebooks = await crud.get_all_personal_notebooks(owner_id)
    return await render_template(
        "/shared/includes/notebook_personal.jinja2",
        owned_notebooks=owned_notebooks)


@blueprint.route("/notebook/shared.html")
@api_login_required
async def rendered_notebook_shared_list():
    owner_id = UUID(current_user.auth_id)
    shared_notebooks = crud.get_shared_notebooks(owner_id)
    return await render_template(
        "/shared/includes/notebook_shared.jinja2",
        shared_notebooks=shared_notebooks)


@blueprint.websocket("/notebook/<notebook_uuid>/ws/<token>")
async def notebook_update_ws(notebook_uuid, token):
    ws_handler = get_ws_handler()
    try:
        owner_id = ws_handler.get_token(token)
        if not owner_id:
            return "token invalid", 401
        notebook_uuid = UUID(notebook_uuid)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        try:
            c_queue = ws_handler.create_client(notebook_uuid)
            producer = asyncio.create_task(ws_send(c_queue))
            consumer = asyncio.create_task(ws_receive())
            await asyncio.gather(producer, consumer)
        except asyncio.CancelledError:
            ws_handler.remove_client(c_queue, notebook_uuid)
            ws_handler.remove_token(token)
            raise
    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook uuid", 404


@blueprint.route("/notebook/<notebook_uuid>/notes.html")
@api_login_required
async def rendered_notes_list(notebook_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        owner_id = UUID(current_user.auth_id)
        notebook = await crud.get_personal_notebook(notebook_uuid)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        notes = await crud.get_notes(notebook_uuid)
        return await render_template(
            "/shared/includes/notes.jinja2",
            notebook=notebook,
            notes=notes)
    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook uuid", 404


@blueprint.websocket("/notebook/<notebook_uuid>/notes/<note_uuid>/ws/<token>")
async def note_update_ws(notebook_uuid, note_uuid, token):
    ws_handler = get_ws_handler()
    try:
        owner_id = ws_handler.get_token(token)
        if not owner_id:
            return "token invalid", 401
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        await crud.get_note(note_uuid)
        try:
            c_queue = ws_handler.create_client(notebook_uuid, note_uuid)
            producer = asyncio.create_task(ws_send(c_queue))
            consumer = asyncio.create_task(ws_receive())
            await asyncio.gather(producer, consumer)
        except asyncio.CancelledError:
            ws_handler.remove_client(c_queue, notebook_uuid, note_uuid)
            ws_handler.remove_token(token)
            raise
    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook uuid", 404


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>.md")
@api_login_required
async def raw_note(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        await crud.get_note(note_uuid)
        md_str = await read_note_file_md(notebook_uuid, note_uuid)
        file_resp = await make_response(md_str)
        file_resp.mimetype = "text/md"
        return file_resp
    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook/user/note", 404


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>.html")
@api_login_required
async def rendered_note(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        await crud.get_note(note_uuid)
        return await read_note_file_html(notebook_uuid, note_uuid)
    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook/user/note", 404


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/prefix")
@api_login_required
async def note_prefix(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("read", "write", "owner"))
        note = await crud.get_note(note_uuid)
        return jsonify(prefix=note.prefix)
    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook/user/note", 404


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/auto-save", methods=["POST"])
@api_login_required
async def note_auto_save(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("write", "owner"))
        note = await crud.get_note(note_uuid)

        updated_content = (await request.form)["content"]
        updated_at = (await request.form)["updated_at"]
        updated_at = datetime_input_type(updated_at, "%Y-%m-%d %H:%M:%S.%f%z")
        if updated_at < note.updated_at:
            # conflict was detected
            return jsonify(updated_at=None, conflict=True)

        # no conflict detected
        await write_note_file_md(notebook_uuid, note_uuid, updated_content)
        await note.save()  # mark the note updated
        await get_ws_handler().broadcast_message(
            make_message(MessageCategory.NOTE_CONTENT_CHANGE),
            notebook_uuid, note_uuid)
        return jsonify(updated_at=str(note.updated_at), conflict=False)

    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook/user/note", 404
    except KeyError:
        return "missing required params", 400


@blueprint.route("/notebook/<notebook_uuid>/notes/<note_uuid>/save", methods=["POST"])
@api_login_required
async def note_save(notebook_uuid, note_uuid):
    try:
        notebook_uuid = UUID(notebook_uuid)
        note_uuid = UUID(note_uuid)
        owner_id = UUID(current_user.auth_id)
        await crud.check_user_notebook_access(
            owner_id,
            notebook_uuid,
            ("write", "owner"))
        note = await crud.get_note(note_uuid)

        updated_content = (await request.form)["content"]
        updated_at = (await request.form)["updated_at"]
        updated_at = datetime_input_type(updated_at, "%Y-%m-%d %H:%M:%S.%f%z")

        conflict = False
        if updated_at < note.updated_at:
            # conflict was detected
            conflict = True
            conflict_dt = note.updated_at.strftime("%Y-%m-%d %H:%M:%S")
            note_backup = await crud.create_note(notebook_uuid, note.prefix + conflict_dt)
            conflict_data = await read_note_file_md(notebook_uuid, note_uuid)
            await write_note_file_md(notebook_uuid, note_backup.uuid, conflict_data)

        await write_note_file_md(notebook_uuid, note_uuid, updated_content)
        await note.save()  # mark the note updated

        await get_ws_handler().broadcast_message(
            make_message(MessageCategory.NOTE_CONTENT_CHANGE),
            notebook_uuid, note_uuid)
        return jsonify(updated_at=str(note.updated_at), conflict=conflict)

    except DoesNotExist:
        return "notebook does not exist, or you don't have access to it", 404
    except ValueError:
        return "invalid notebook/user/note", 404
    except KeyError:
        return "missing required params", 400
