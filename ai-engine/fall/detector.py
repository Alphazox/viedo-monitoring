"""Lightweight, no-pose-model fall detection from bounding-box geometry.

Runs YOLO+DeepSORT across a clip (optionally striding frames to cover more
real time within a bounded amount of inference) and watches each track's
bbox aspect ratio (height/width) and vertical center over time. A person
standing or walking is consistently "tall" (high aspect ratio); a fall
collapses that ratio quickly as they go from upright to prone. This is the
same bbox-geometry heuristic most lightweight fall detectors use when a
full pose-estimation model is out of scope (see FALL_CONFIDENCE_THRESHOLD
in .env.example) — it is not a certainty signal, just a fast, explainable
proxy, same spirit as events/activity_rules.py's day/night + loitering
heuristic.
"""

import statistics
from collections import defaultdict
from dataclasses import dataclass

import cv2

from inference.pipeline import get_detector
from tracking.tracker import PersonTracker

FALL_ASPECT_DROP_RATIO = 0.6
FALL_WINDOW_SECONDS = 2.0
MIN_BASELINE_SAMPLES = 5
DEFAULT_MAX_FRAMES = 300
DEFAULT_FRAME_STRIDE = 2


@dataclass
class FallEvent:
    track_id: str
    frame_index: int
    timestamp_seconds: float
    aspect_before: float
    aspect_after: float
    confidence: float


def _detect_fall_in_history(
    history: dict[str, list[tuple[int, float, float]]], fps: float, frame_stride: int
) -> FallEvent | None:
    effective_fps = max(fps / frame_stride, 1.0)
    window = max(int(FALL_WINDOW_SECONDS * effective_fps), 3)

    best: FallEvent | None = None
    for track_id, points in history.items():
        if len(points) < MIN_BASELINE_SAMPLES + window:
            continue
        aspects = [p[1] for p in points]
        baseline = statistics.median(aspects[:MIN_BASELINE_SAMPLES])
        if baseline <= 0:
            continue

        running_max = baseline
        for i in range(len(points)):
            running_max = max(running_max, aspects[i])
            if i < window:
                continue
            recent_high = max(aspects[i - window : i])
            if recent_high >= running_max * 0.8 and aspects[i] <= running_max * FALL_ASPECT_DROP_RATIO:
                drop_ratio = 1 - (aspects[i] / running_max)
                confidence = round(min(0.99, 0.5 + drop_ratio), 2)
                candidate = FallEvent(
                    track_id=track_id,
                    frame_index=points[i][0],
                    timestamp_seconds=round(points[i][0] / fps, 2),
                    aspect_before=round(recent_high, 3),
                    aspect_after=round(aspects[i], 3),
                    confidence=confidence,
                )
                if best is None or candidate.confidence > best.confidence:
                    best = candidate
                break  # first collapse is the fall — don't keep scanning this track
    return best


def analyze_fall(
    video_path: str,
    max_frames: int = DEFAULT_MAX_FRAMES,
    frame_stride: int = DEFAULT_FRAME_STRIDE,
) -> tuple[FallEvent | None, dict]:
    """Returns (event_or_None, stats). Samples up to `max_frames` frames,
    every `frame_stride`-th real frame, so a bounded amount of CPU YOLO
    inference can still cover a clip several times longer than the single
    `max_frames`-frame window used elsewhere in this service (gait/
    detection don't need to — a fall can happen anywhere in a longer clip,
    not just the first few seconds)."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    detector = get_detector()
    tracker = PersonTracker()

    history: dict[str, list[tuple[int, float, float]]] = defaultdict(list)
    frame_index = 0
    sampled = 0
    try:
        while sampled < max_frames:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_index % frame_stride == 0:
                height, width = frame.shape[:2]
                for track_id, (x1, y1, x2, y2) in tracker.update(frame, detector.detect(frame)):
                    bw, bh = max(x2 - x1, 1), max(y2 - y1, 1)
                    aspect = bh / bw
                    cy_fraction = ((y1 + y2) / 2) / height
                    history[track_id].append((frame_index, aspect, cy_fraction))
                sampled += 1
            frame_index += 1
    finally:
        cap.release()

    event = _detect_fall_in_history(history, fps, frame_stride)
    stats = {"frames_processed": frame_index, "frames_sampled": sampled, "tracks_found": len(history)}
    return event, stats
