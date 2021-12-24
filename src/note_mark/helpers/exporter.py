from dataclasses import dataclass
from datetime import datetime
from typing import Optional, overload
from uuid import UUID

from ..database.crud import get_users
from ..database.models import User


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
