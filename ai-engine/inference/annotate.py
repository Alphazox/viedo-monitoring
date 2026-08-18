"""Draws real YOLOv8+DeepSORT detections onto a clip's frames — the pipeline
in pipeline.py/tracking/tracker.py already does the detection and tracking;
this is the only place that consumes it as a visible overlay rather than
just numeric tracks/bboxes fed into gait embedding or the activity
heuristic.
"""

from pathlib import Path

import cv2

from detection.person_detector import PersonDetector
from inference.video_utils import transcode_to_h264
from tracking.tracker import PersonTracker

MAX_FRAMES = 300
BOX_COLOR = (0, 255, 0)
BOX_THICKNESS = 2


def annotate_video(
    detector: PersonDetector,
    input_path: str,
    output_path: Path,
    max_frames: int = MAX_FRAMES,
    all_classes: bool = False,
) -> dict:
    """Re-runs detection+tracking frame by frame (rather than reusing
    pipeline.track_people's aggregated Track objects) so each frame can be
    annotated with that frame's own live bboxes as the clip is walked
    through once, instead of needing a second pass to re-associate frames
    with per-track bbox history."""
    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if width == 0 or height == 0:
        cap.release()
        raise ValueError(f"Could not read video dimensions from {input_path!r}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    tracker = PersonTracker()
    frame_count = 0
    max_detections_in_frame = 0
    track_ids_seen: set[str] = set()

    try:
        while frame_count < max_frames:
            ok, frame = cap.read()
            if not ok:
                break

            detections = detector.detect_objects(frame) if all_classes else detector.detect(frame)
            active = tracker.update(frame, detections, require_confirmed=not all_classes)
            max_detections_in_frame = max(max_detections_in_frame, len(detections))

            annotated = frame.copy()
            for track_id, (x1, y1, x2, y2) in active:
                track_ids_seen.add(track_id)
                cv2.rectangle(annotated, (x1, y1), (x2, y2), BOX_COLOR, BOX_THICKNESS)
                label = f"{tracker.label_for(track_id)} #{track_id}"
                label_y = y1 - 8 if y1 - 8 > 12 else y1 + 18
                cv2.putText(
                    annotated, label, (x1, label_y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, BOX_COLOR, 2, cv2.LINE_AA
                )

            writer.write(annotated)
            frame_count += 1
    finally:
        cap.release()
        writer.release()

    transcode_to_h264(output_path)

    return {
        "frames_processed": frame_count,
        "tracks_found": len(track_ids_seen),
        "max_detections_in_frame": max_detections_in_frame,
    }
