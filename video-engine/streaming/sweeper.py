"""Deletes HLS segment files older than the retention window, across every
camera's live directory. Runs on a timer from main.py's lifespan — keeps
disk usage bounded without deleting segments the moment they leave the live
playlist (which would break clip extraction over recent history)."""
from __future__ import annotations

import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)


def sweep_old_segments(live_dir: Path, retention_seconds: float) -> int:
    if not live_dir.exists():
        return 0
    cutoff = time.time() - retention_seconds
    removed = 0
    for segment in live_dir.glob("*/*.ts"):
        try:
            if segment.stat().st_mtime < cutoff:
                segment.unlink(missing_ok=True)
                removed += 1
        except OSError:
            logger.debug("Could not remove stale segment %s", segment, exc_info=True)

    # A camera directory whose index.m3u8 hasn't been rewritten since before
    # the cutoff means its ffmpeg muxer isn't running (decommissioned or
    # long-disabled camera) -- clean up the orphaned playlist and, once the
    # directory is empty, the directory itself.
    for camera_dir in live_dir.glob("*"):
        if not camera_dir.is_dir():
            continue
        playlist = camera_dir / "index.m3u8"
        try:
            if playlist.exists() and playlist.stat().st_mtime < cutoff:
                playlist.unlink(missing_ok=True)
                removed += 1
        except OSError:
            logger.debug("Could not remove stale playlist %s", playlist, exc_info=True)

        try:
            next(camera_dir.iterdir())
        except StopIteration:
            try:
                camera_dir.rmdir()
            except OSError:
                logger.debug("Could not remove empty camera dir %s", camera_dir, exc_info=True)
        except FileNotFoundError:
            pass

    return removed
