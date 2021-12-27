from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


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
