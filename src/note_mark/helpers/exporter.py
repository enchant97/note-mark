import tarfile
from dataclasses import asdict, dataclass
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Optional, overload
from uuid import UUID, uuid4

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
    total_notes: int
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

    total_notes = 0

    for user in users:
        processed_user = UserExportV1(user.uuid, user.username, [])
        for notebook in await user.owned_notebooks.all():
            processed_nb = NotebookExportV1(notebook.uuid, notebook.prefix, [])
            for note in await notebook.notes.all():
                processed_note = NoteExportV1(note.uuid, note.prefix)
                processed_nb.notes.append(processed_note)
                total_notes += 1
            processed_user.notebooks.append(processed_nb)
        processed_users.append(processed_user)

    return ExportV1(
        processed_users,
        total_notes,
        datetime.utcnow(),
    )


def _add_v1_content_to_tar(exported: ExportV1, tar: tarfile.TarFile):
    # add the metadata file
    meta_dump = json.dumps(asdict(exported), indent=4, default=str).encode()
    meta_info = tarfile.TarInfo("meta.json")
    meta_info.size = len(meta_dump)
    meta_info.mtime = datetime.utcnow().timestamp()
    tar.addfile(meta_info, BytesIO(meta_dump))

    # add each note to the file
    for user in exported.users:
        for notebook in user.notebooks:
            for note in notebook.notes:
                dst = Path("notes") / (note.uuid.hex + ".md")
                src = combine_note_path(notebook.uuid, note.uuid)
                tar.add(src, dst)


def exported_v1_to_exports(exported: ExportV1) -> Path:
    """
    Export the exported metadata and copy notes into
    the export directory under unique filename
    beginning with 'export', compressing to a tar.gz file

        :param exported: The export metadata
        :return: Path to where export took place
    """
    # make a temp filename and finished filename
    export_path_temp = get_admin_export_path() / ("export-" + uuid4().hex[:8] + ".tmp")
    export_path = export_path_temp.with_suffix(".tar.gz")

    with tarfile.open(export_path_temp, "x:gz") as tar:
        # add content to tar obj
        _add_v1_content_to_tar(exported, tar)

    # writing to file has finished,
    # 'unlock' the file by removing .tmp extention
    export_path_temp.rename(export_path)

    return export_path


def exported_v1_to_memory(
        exported: ExportV1,
        bytes_obj: Optional[BytesIO]) -> BytesIO:
    """
    Same as exported_v1_to_exports but
    instead exports to a BytesIO obj

        :param exported: The export metadata
        :param bytes_obj: A optionally open stream, defaults to None
        :return: the bytes stream
    """
    if bytes_obj is None:
        bytes_obj = BytesIO()

    with tarfile.open(bytes_obj, "w:gz") as tar:
        # add content to tar obj
        _add_v1_content_to_tar(exported, tar)

    return bytes_obj
