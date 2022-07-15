from pathlib import Path
from uuid import UUID

from ..config import get_settings


def get_admin_import_path() -> Path:
    return get_settings().DATA_PATH / "import"


def get_admin_export_path() -> Path:
    return get_settings().DATA_PATH / "export"


def get_notebooks_path() -> Path:
    return get_settings().DATA_PATH / "notebooks"


def combine_notebook_path(notebook: UUID) -> Path:
    return get_notebooks_path() / notebook.hex


def combine_note_path(notebook: UUID, note: UUID) -> Path:
    return combine_notebook_path(notebook) / (note.hex + ".md")
