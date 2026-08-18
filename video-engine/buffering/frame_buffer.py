"""Bounded, thread-safe ring buffer of recently decoded frames. One camera
worker thread pushes; the FastAPI request thread (on-demand snapshot/clip
endpoints) and the periodic ai-engine forwarder both read — hence the lock."""
from __future__ import annotations

import threading
import time
from collections import deque
from dataclasses import dataclass

import numpy as np


@dataclass
class TimestampedFrame:
    frame: np.ndarray
    timestamp: float


class FrameBuffer:
    def __init__(self, max_seconds: float):
        self._max_seconds = max_seconds
        self._lock = threading.Lock()
        self._frames: deque[TimestampedFrame] = deque()

    def push(self, frame: np.ndarray) -> None:
        now = time.time()
        with self._lock:
            self._frames.append(TimestampedFrame(frame=frame, timestamp=now))
            cutoff = now - self._max_seconds
            while self._frames and self._frames[0].timestamp < cutoff:
                self._frames.popleft()

    def latest(self) -> np.ndarray | None:
        with self._lock:
            return self._frames[-1].frame if self._frames else None

    def last_seconds(self, seconds: float) -> list[TimestampedFrame]:
        cutoff = time.time() - seconds
        with self._lock:
            return [f for f in self._frames if f.timestamp >= cutoff]

    def __len__(self) -> int:
        with self._lock:
            return len(self._frames)
