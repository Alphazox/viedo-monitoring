from __future__ import annotations

import time
from pathlib import Path

import numpy as np

from buffering.frame_buffer import TimestampedFrame
from clips.writer import write_clip


def test_write_clip_produces_a_readable_mp4(tmp_path: Path):
    frames = [
        TimestampedFrame(frame=np.zeros((16, 16, 3), dtype=np.uint8), timestamp=time.time() + i * 0.1)
        for i in range(5)
    ]

    path = write_clip(frames, tmp_path, camera_id="cam-1", fps=10.0)

    assert path is not None
    assert path.exists()
    assert path.stat().st_size > 0

    import cv2

    cap = cv2.VideoCapture(str(path))
    try:
        assert cap.isOpened()
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        assert frame_count == 5
    finally:
        cap.release()


def test_write_clip_with_no_frames_returns_none(tmp_path: Path):
    assert write_clip([], tmp_path, camera_id="cam-1") is None
