"""
markdown file/folder functions
"""
import shutil
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Generator
from uuid import UUID

import aiofiles
from markdown import markdown

from ..config import get_settings


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


def delete_note_file(notebook: UUID, note: UUID):
    """
    delete a notebook file in a notebook

        :param notebook: the notebook uuid
        :param note: the note uuid
    """
    fn = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex) / Path(note.hex + ".md")
    fn.unlink(missing_ok=True)


def delete_notebook_folder(notebook: UUID):
    """
    delete a notebook folder

        :param notebook: the notebook uuid
    """
    notebook_path = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex)
    shutil.rmtree(notebook_path, ignore_errors=True)


def get_notebook_files(notebook: UUID) -> Generator[Path, None, None]:
    """
    yield each note file from a specific notebook

        :param notebook: the notebook uuid
        :yield: the full path of the notebook file
    """
    notebook_path = notebook_path = get_settings().DATA_PATH / Path("notebooks") / Path(notebook.hex)
    for fn in notebook_path.glob("*.md"):
        yield fn


def create_notebook_zip(notebook: UUID) -> BytesIO:
    """
    create and return a notebook as a zip file

        :param notebook: the notebook uuid
        :return: the zip file as BytesIO obj
    """
    file_obj = BytesIO()
    with zipfile.ZipFile(
            file_obj, mode="w",
            compression=zipfile.ZIP_STORED,
            compresslevel=None) as zip_obj:
        for file_path in get_notebook_files(notebook):
            zip_obj.write(file_path, file_path.name)
    file_obj.seek(0)
    return file_obj
