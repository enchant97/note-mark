import shutil
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Any, Callable, Union
from uuid import UUID

import aiofiles
from markdown import markdown
from quart_auth import current_user

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


def datetime_input_type(
        datetime_str: Union[str, None],
        format_="%Y-%m-%dT%H:%M") -> Union[datetime, None]:
    """
    convert a HTML datetime-local
    input into a python datetime obj

        :param datetime_str: the input datetime str
        :param format_: the datetime format, defaults to '%Y-%m-%dT%H:%M'
        :return: the converted datetime obj or None
    """
    if datetime_str is None or datetime_str == "":
        return None
    return datetime.strptime(datetime_str, format_)


def api_login_required(func: Callable) -> Callable:
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        if not await current_user.is_authenticated:
            return "you must pass a valid login cookie", 401
        else:
            return await func(*args, **kwargs)
    return wrapper
