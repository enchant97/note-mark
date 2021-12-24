import shutil
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional, overload
from uuid import UUID

try:
    import rapidjson as json
except ImportError:
    import json

from ..database.crud import get_users
from ..database.models import User
from .paths import combine_note_path, get_admin_export_path


@dataclass
class NoteExportV1:
    uuid: UUID
    prefix: str

@dataclass
class NotebookExportV1:
    uuid: UUID
    prefix: str
    notes: list[NoteExportV1]


@dataclass
class UserExportV1:
    uuid: UUID
    username: str
    notebooks: list[NotebookExportV1]


@dataclass
class ExportV1:
    users: list[UserExportV1]
    dt_stamp: datetime
    version: int = 1


@overload
async def export_v1() -> ExportV1:
    """
    Generate a export using V1, getting the users from database

        :return: the exported metadata
    """
    ...


@overload
async def export_v1(users: list[User]) -> ExportV1:
    """
    Generate a export using V1, using provided users

        :param users: The users
        :return: the exported metadata
    """
    ...


async def export_v1(users: Optional[list[User]] = None) -> ExportV1:
    processed_users: list[UserExportV1] = []

    if users is None:
        users = await get_users()

    for user in users:
        processed_user = UserExportV1(user.uuid, user.username, [])
        for notebook in await user.owned_notebooks.all():
            processed_nb = NotebookExportV1(notebook.uuid, notebook.prefix, [])
            for note in await notebook.notes.all():
                processed_note = NoteExportV1(note.uuid, note.prefix)
                processed_nb.notes.append(processed_note)
            processed_user.notebooks.append(processed_nb)
        processed_users.append(processed_user)

    return ExportV1(
        processed_users,
        datetime.utcnow(),
    )


def exported_v1_to_exports(exported: ExportV1, show_completion: bool = False) -> Path:
    """
    Export the exported metadata and copy notes into
    the export directory under current datetime,

        :param exported: The export metadata
        :param show_completion: Place a 'done.txt' file in
                                directory when export is complete
        :return: Path to where export took place
    """
    export_path = get_admin_export_path() / datetime.utcnow().isoformat()
    exported_notes_path = export_path / "notes"
    export_path.mkdir()
    exported_notes_path.mkdir()

    with open(export_path / "meta.json", "wt") as fo:
        json.dump(asdict(exported), fo, indent=4, default=str)

    for user in exported.users:
        for notebook in user.notebooks:
            for note in notebook.notes:
                dst = exported_notes_path / (note.uuid.hex + ".md")
                src = combine_note_path(notebook.uuid, note.uuid)
                shutil.copyfile(src, dst)

    if show_completion:
        with open(export_path / "done.txt", "wt") as fo:
            pass

    return export_path
