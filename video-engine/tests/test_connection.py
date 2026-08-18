from __future__ import annotations

import threading
from pathlib import Path

import cv2
import numpy as np

from rtsp.connection import RtspConnection


def _make_tiny_clip(path: Path, frame_count: int = 3) -> None:
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, 10.0, (8, 8))
    for _ in range(frame_count):
        writer.write(np.zeros((8, 8, 3), dtype=np.uint8))
    writer.release()


def test_rtsp_source_is_not_treated_as_local_file():
    conn = RtspConnection("rtsp://camera.local/stream")
    assert conn._is_local_file is False


def test_local_path_is_treated_as_local_file():
    conn = RtspConnection("./storage/uploads/sample.mp4")
    assert conn._is_local_file is True


def test_local_file_loops_past_end_of_stream(tmp_path):
    clip_path = tmp_path / "tiny.mp4"
    _make_tiny_clip(clip_path, frame_count=3)

    conn = RtspConnection(str(clip_path))
    assert conn.open() is True
    try:
        reads = [conn.read()[0] for _ in range(3 + 2)]  # run past the 3 real frames
        assert all(reads)  # every read succeeds -- EOF triggers a loop, not a failure
    finally:
        conn.release()


def test_reconnect_loop_open_stops_when_event_is_set():
    conn = RtspConnection("rtsp://does-not-exist.invalid/stream", reconnect_backoff_seconds=0.01)
    stop_event = threading.Event()
    stop_event.set()  # already stopped -> reconnect_loop_open must return immediately

    assert conn.reconnect_loop_open(stop_event) is False
