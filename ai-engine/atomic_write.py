"""Shared helper for the small JSON-file-backed stores in this service
(events/alerts.py's AlertLog, indexing/gallery.py's GaitGallery). A plain
`path.write_text(...)` truncates the file before writing the new content, so
a crash mid-write (or mid-process-restart) leaves a truncated/corrupt file
that the next `_load()` fails to parse. Writing to a temp file in the same
directory and atomically renaming it over the target avoids that window.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path


def atomic_write_text(path: Path, content: str) -> None:
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(content)
        os.replace(tmp_name, path)
    except BaseException:
        Path(tmp_name).unlink(missing_ok=True)
        raise
