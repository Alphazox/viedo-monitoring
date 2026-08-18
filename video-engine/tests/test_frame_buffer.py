from __future__ import annotations

import time

import numpy as np

from buffering.frame_buffer import FrameBuffer


def _frame() -> np.ndarray:
    return np.zeros((4, 4, 3), dtype=np.uint8)


def test_push_and_latest():
    buf = FrameBuffer(max_seconds=10)
    assert buf.latest() is None
    buf.push(_frame())
    assert buf.latest() is not None
    assert len(buf) == 1


def test_old_frames_are_evicted():
    buf = FrameBuffer(max_seconds=0.05)
    buf.push(_frame())
    time.sleep(0.1)
    buf.push(_frame())
    assert len(buf) == 1  # the first frame aged out


def test_last_seconds_filters_by_recency():
    buf = FrameBuffer(max_seconds=10)
    buf.push(_frame())
    time.sleep(0.05)
    recent = buf.last_seconds(0.02)
    assert recent == []  # the pushed frame is already older than the window

    all_recent = buf.last_seconds(10)
    assert len(all_recent) == 1
