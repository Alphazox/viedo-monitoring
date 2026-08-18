from collections import defaultdict, deque

import numpy as np
from deep_sort_realtime.deepsort_tracker import DeepSort

from detection.person_detector import Detection

# Caps memory per track and matches embeddings/silhouette.py's own max_frames
# default — no point buffering more than the gait pipeline will read.
MAX_TRACK_FRAMES = 90


class PersonTracker:
    """Wraps deep-sort-realtime's DeepSort to re-identify the same person
    across frames within one clip, and additionally buffers each track's
    full frames + bboxes — DeepSort itself only carries current per-track
    state (bbox, Kalman motion state, appearance descriptor), not frame
    history, but the gait pipeline needs an ordered walking sequence.

    Buffers whole frames rather than pre-cropped patches deliberately: see
    Track.roi_crops() in inference/pipeline.py for why a per-frame tight crop
    would break background subtraction.
    """

    def __init__(self, max_age: int = 15) -> None:
        self._deepsort = DeepSort(max_age=max_age)
        self._frames: dict[str, deque[np.ndarray]] = defaultdict(
            lambda: deque(maxlen=MAX_TRACK_FRAMES)
        )
        self._bboxes: dict[str, deque[tuple[int, int, int, int]]] = defaultdict(
            lambda: deque(maxlen=MAX_TRACK_FRAMES)
        )
        self._labels: dict[str, str] = {}

    def update(
        self, frame: np.ndarray, detections: list[Detection], require_confirmed: bool = True
    ) -> list[tuple[str, tuple[int, int, int, int]]]:
        """Returns this frame's (track_id, bbox) pairs, in addition to the
        existing side effect of buffering them into self._frames/
        self._bboxes for tracks()/pipeline.Track — annotate.py draws these
        directly rather than replaying tracks() after the fact.

        By default only returns DeepSort-confirmed tracks (seen consistently
        across several frames) — right for re-identifying a person walking
        through a clip. require_confirmed=False skips that gate, needed for
        general object detection: a static background object (a bench, a
        parked car) may only cross YOLO's confidence threshold on scattered
        frames rather than several in a row, so it would never confirm and
        would silently never get drawn."""
        # deep-sort-realtime's raw detection format: ([x, y, w, h], confidence, class_name).
        raw = [
            (
                [d.bbox[0], d.bbox[1], d.bbox[2] - d.bbox[0], d.bbox[3] - d.bbox[1]],
                d.confidence,
                d.class_name,
            )
            for d in detections
        ]
        tracks = self._deepsort.update_tracks(raw, frame=frame)

        height, width = frame.shape[:2]
        active: list[tuple[str, tuple[int, int, int, int]]] = []
        for track in tracks:
            if require_confirmed and not track.is_confirmed():
                continue
            x1, y1, x2, y2 = (int(v) for v in track.to_ltrb())
            x1, y1 = max(x1, 0), max(y1, 0)
            x2, y2 = min(x2, width), min(y2, height)
            if x2 <= x1 or y2 <= y1:
                continue
            self._frames[track.track_id].append(frame)
            self._bboxes[track.track_id].append((x1, y1, x2, y2))
            self._labels[track.track_id] = track.get_det_class() or "person"
            active.append((track.track_id, (x1, y1, x2, y2)))
        return active

    def label_for(self, track_id: str) -> str:
        """Class name (e.g. 'person', 'car') last seen for this track.
        Doesn't change update()'s return shape, since callers like
        fall/detector.py already destructure it as (track_id, bbox)."""
        return self._labels.get(track_id, "object")

    def tracks(self) -> dict[str, dict]:
        return {
            track_id: {"frames": list(frames), "bboxes": list(self._bboxes[track_id])}
            for track_id, frames in self._frames.items()
        }
