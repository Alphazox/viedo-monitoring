from collections import defaultdict, deque

import numpy as np
from deep_sort_realtime.deepsort_tracker import DeepSort

from app.detection.person_detector import Detection

# Caps memory per track and matches app/gait/silhouette.py's own max_frames
# default — no point buffering more than the gait pipeline will read.
MAX_TRACK_FRAMES = 90


class PersonTracker:
    """Wraps deep-sort-realtime's DeepSort to re-identify the same person
    across frames within one clip, and additionally buffers each track's
    full frames + bboxes — DeepSort itself only carries current per-track
    state (bbox, Kalman motion state, appearance descriptor), not frame
    history, but the gait pipeline needs an ordered walking sequence.

    Buffers whole frames rather than pre-cropped patches deliberately: see
    Track.roi_crops() in app/detection/pipeline.py for why a per-frame tight
    crop would break background subtraction.
    """

    def __init__(self, max_age: int = 15) -> None:
        self._deepsort = DeepSort(max_age=max_age)
        self._frames: dict[str, deque[np.ndarray]] = defaultdict(
            lambda: deque(maxlen=MAX_TRACK_FRAMES)
        )
        self._bboxes: dict[str, deque[tuple[int, int, int, int]]] = defaultdict(
            lambda: deque(maxlen=MAX_TRACK_FRAMES)
        )

    def update(self, frame: np.ndarray, detections: list[Detection]) -> list[tuple[str, tuple[int, int, int, int]]]:
        """Returns this frame's confirmed (track_id, bbox) pairs, in addition
        to the existing side effect of buffering them into self._frames/
        self._bboxes for tracks()/pipeline.Track — annotate.py draws these
        directly rather than replaying tracks() after the fact."""
        # deep-sort-realtime's raw detection format: ([x, y, w, h], confidence, class_name).
        raw = [
            (
                [d.bbox[0], d.bbox[1], d.bbox[2] - d.bbox[0], d.bbox[3] - d.bbox[1]],
                d.confidence,
                "person",
            )
            for d in detections
        ]
        tracks = self._deepsort.update_tracks(raw, frame=frame)

        height, width = frame.shape[:2]
        active: list[tuple[str, tuple[int, int, int, int]]] = []
        for track in tracks:
            if not track.is_confirmed():
                continue
            x1, y1, x2, y2 = (int(v) for v in track.to_ltrb())
            x1, y1 = max(x1, 0), max(y1, 0)
            x2, y2 = min(x2, width), min(y2, height)
            if x2 <= x1 or y2 <= y1:
                continue
            self._frames[track.track_id].append(frame)
            self._bboxes[track.track_id].append((x1, y1, x2, y2))
            active.append((track.track_id, (x1, y1, x2, y2)))
        return active

    def tracks(self) -> dict[str, dict]:
        return {
            track_id: {"frames": list(frames), "bboxes": list(self._bboxes[track_id])}
            for track_id, frames in self._frames.items()
        }
