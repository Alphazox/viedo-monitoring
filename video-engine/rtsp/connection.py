"""Wraps cv2.VideoCapture with the two reconnect behaviors this service
needs: a dropped RTSP stream needs a full re-open, while a local demo file
hitting end-of-stream just needs to loop back to frame 0 (it's standing in
for a live camera, not actually finished)."""
from __future__ import annotations

import logging
import threading

import cv2
import numpy as np

logger = logging.getLogger(__name__)


def is_rtsp_source(source: str) -> bool:
    return source.lower().startswith("rtsp://")


class RtspConnection:
    def __init__(self, source: str, reconnect_backoff_seconds: float = 5.0):
        self.source = source
        self.reconnect_backoff_seconds = reconnect_backoff_seconds
        self._is_local_file = not is_rtsp_source(source)
        self._cap: cv2.VideoCapture | None = None

    def open(self) -> bool:
        self._cap = cv2.VideoCapture(self.source)
        return self._cap.isOpened()

    def read(self) -> tuple[bool, np.ndarray | None]:
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ok, frame = self._cap.read()
        if not ok and self._is_local_file:
            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = self._cap.read()
        return ok, frame

    def fps(self) -> float:
        if self._cap is None:
            return 0.0
        return self._cap.get(cv2.CAP_PROP_FPS) or 0.0

    def release(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def reconnect_loop_open(self, stop_event: threading.Event) -> bool:
        """Blocks, retrying open() on a backoff, until it succeeds or
        stop_event is set. Returns False only when told to stop."""
        while not stop_event.is_set():
            if self.open():
                return True
            logger.warning(
                "Failed to open source %s, retrying in %.1fs", self.source, self.reconnect_backoff_seconds
            )
            stop_event.wait(self.reconnect_backoff_seconds)
        return False
