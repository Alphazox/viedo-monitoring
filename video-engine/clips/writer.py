from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

import cv2

from buffering.frame_buffer import TimestampedFrame


def write_clip(frames: Sequence[TimestampedFrame], output_dir: Path, camera_id: str, fps: float = 15.0) -> Path | None:
    if not frames:
        return None
    output_dir.mkdir(parents=True, exist_ok=True)
    height, width = frames[0].frame.shape[:2]
    filename = f"{camera_id}-{int(frames[-1].timestamp)}.mp4"
    path = output_dir / filename

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, max(fps, 1.0), (width, height))
    try:
        for tf in frames:
            writer.write(tf.frame)
    finally:
        writer.release()
    return path
