import tarfile
from dataclasses import asdict
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Optional
from uuid import uuid4

try:
    import rapidjson as json
except ImportError:
    import json

from ...paths import combine_note_path, get_admin_export_path
from .types import ExportV1


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
    beginning with 'export', into to a tar file

        :param exported: The export metadata
        :return: Path to where export took place
    """
    # make a temp filename and finished filename
    export_path_temp = get_admin_export_path() / ("export-" + uuid4().hex[:8] + ".tmp")
    export_path = export_path_temp.with_suffix(".tar")

    with tarfile.open(export_path_temp, "x") as tar:
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

    with tarfile.open(bytes_obj, "w") as tar:
        # add content to tar obj
        _add_v1_content_to_tar(exported, tar)

    return bytes_obj
