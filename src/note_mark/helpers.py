from pathlib import Path
from uuid import UUID

import aiofiles
from markdown import markdown

from .config import get_settings


async def write_note_file(notebook: UUID, note: UUID, md_str=""):
    fn = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex) / Path(note.hex + ".md")
    fn.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(fn, "wt") as fo:
        await fo.write(md_str)


async def read_note_file_html(notebook: UUID, note: UUID):
    fn = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex) / Path(note.hex + ".md")
    loaded_file = None
    async with aiofiles.open(fn, "rt") as fo:
        loaded_file = markdown(await fo.read())
    return markdown(loaded_file)
