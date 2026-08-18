from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from detection.person_detector import PersonDetector
from inference.config import get_settings
from tracking.tracker import PersonTracker

MAX_FRAMES = 90
ROI_PADDING = 15

_settings = get_settings()
# Eagerly constructed at import time (same pattern as gait routes' _service
# and events/alerts.py's alert_log) so the YOLO weights download happens once
# at startup, not on the first request.
_detector = PersonDetector(
    Path(_settings.demo_data_dir) / "detection",
    model_name=_settings.ai_model_path,
)


def get_detector() -> PersonDetector:
    return _detector


@dataclass
class Track:
    track_id: str
    bboxes: list[tuple[int, int, int, int]]
    frames: list[np.ndarray]

    @property
    def length(self) -> int:
        return len(self.frames)

    def centroids(self) -> list[tuple[int, int]]:
        return [((x1 + x2) // 2, (y1 + y2) // 2) for x1, y1, x2, y2 in self.bboxes]

    def roi_crops(self, padding: int = ROI_PADDING) -> list[np.ndarray]:
        """Crops every frame to one fixed window — the union of this track's
        bboxes across the whole clip, padded — rather than a per-frame tight
        bbox. A per-frame tight/recentered crop would defeat background
        subtraction's core assumption (a mostly-static background with the
        subject moving through it): recentering the crop on the person every
        frame makes the person's own silhouette the "static" thing MOG2
        learns as background, not the actual background. A fixed window lets
        the person move relative to a real (mostly) static background within
        it, the same assumption the whole-frame legacy path and the
        synthetic demo-video generator both rely on.
        """
        x1 = max(min(b[0] for b in self.bboxes) - padding, 0)
        y1 = max(min(b[1] for b in self.bboxes) - padding, 0)
        x2 = max(b[2] for b in self.bboxes) + padding
        y2 = max(b[3] for b in self.bboxes) + padding
        return [frame[y1:y2, x1:x2] for frame in self.frames]


def track_people(video_path: str, max_frames: int = MAX_FRAMES) -> list[Track]:
    """Runs the shared PersonDetector + PersonTracker over a clip and returns
    one Track per re-identified person, longest (primary) first — the demo's
    single-subject assumption made explicit rather than implicit the way
    whole-frame background subtraction leaves it.

    Returns [] if YOLO finds no people anywhere in the clip — see
    detection/__init__.py for why that's expected for this repo's own
    synthetic demo clips, and how callers should fall back in that case.
    """
    cap = cv2.VideoCapture(video_path)
    tracker = PersonTracker()
    frame_count = 0
    try:
        while frame_count < max_frames:
            ok, frame = cap.read()
            if not ok:
                break
            tracker.update(frame, _detector.detect(frame))
            frame_count += 1
    finally:
        cap.release()

    tracks = [
        Track(track_id=track_id, bboxes=data["bboxes"], frames=data["frames"])
        for track_id, data in tracker.tracks().items()
        if data["frames"]
    ]
    tracks.sort(key=lambda t: t.length, reverse=True)
    return tracks
