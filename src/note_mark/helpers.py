from pathlib import Path
from uuid import UUID

import aiofiles
from markdown import markdown

from .config import get_settings


async def write_note_file_md(notebook: UUID, note: UUID, md_str: str = ""):
    """
    writes a note.md, either creating a
    empty file or using the str to write,
    will make the folders if none exist

        :param notebook: the notebook uuid
        :param note: the note uuid
    """
    notebook_path = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex)
    notebook_path.mkdir(parents=True, exist_ok=True)
    fn = notebook_path / Path(note.hex + ".md")
    # make sure new line tags use LF
    md_str = md_str.replace("\r\n", "\n")
    async with aiofiles.open(fn, "w") as fo:
       await fo.write(md_str)


async def read_note_file_md(notebook: UUID, note: UUID) -> str:
    """
    read a note.md from notebook and return it as a str

        :param notebook: the notebook uuid
        :param note: the note uuid
        :return: the markdown document
    """
    fn = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex) / Path(note.hex + ".md")
    loaded_file = None
    async with aiofiles.open(fn, "r") as fo:
        loaded_file = await fo.read()
    return loaded_file


async def read_note_file_html(notebook: UUID, note: UUID) -> str:
    """
    read a note.md from notebook and render as html,
    uses read_note_file_md to load file

        :param notebook: the notebook uuid
        :param note: the note uuid
        :return: the rendered markdown as html
    """
    return markdown(
        await read_note_file_md(notebook, note),
        extensions=[
            "extra", "sane_lists", "smarty",
            "toc", "admonition", "codehilite"])
