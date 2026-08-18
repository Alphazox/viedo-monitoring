from dataclasses import dataclass

import cv2

from embeddings.silhouette import extract_silhouettes, read_video_frames
from inference.pipeline import track_people


@dataclass
class Trajectory:
    # One (x, y) centroid per valid frame, in chronological order (some
    # low-confidence frames may be dropped along either path below, so gaps
    # in time are possible but the ordering is preserved).
    centroids: list[tuple[int, int]]


def track_centroids(video_path: str) -> Trajectory:
    """Real YOLO+DeepSORT tracking first (detection/, tracking/) — a track's
    bbox centers are a direct, more accurate position trail than deriving
    one from a silhouette mask. Falls back to the legacy whole-frame
    background-subtraction + silhouette-moments approach only if no person
    was detected — e.g. this repo's own synthetic demo clips (see
    detection/__init__.py).
    """
    tracks = track_people(video_path)
    if tracks:
        return Trajectory(centroids=tracks[0].centroids())

    silhouettes = extract_silhouettes(read_video_frames(video_path))
    centroids: list[tuple[int, int]] = []
    for mask in silhouettes:
        moments = cv2.moments(mask, binaryImage=True)
        if moments["m00"] == 0:
            continue
        cx = int(moments["m10"] / moments["m00"])
        cy = int(moments["m01"] / moments["m00"])
        centroids.append((cx, cy))
    return Trajectory(centroids=centroids)


def mean_frame_brightness(video_path: str, sample_frames: int = 30) -> float:
    """Average grayscale pixel intensity across a sample of frames — a rough
    proxy for "is this likely a nighttime clip", since demo videos carry no
    real capture timestamp to check against business hours."""
    cap = cv2.VideoCapture(video_path)
    total = 0.0
    count = 0
    while count < sample_frames:
        ok, frame = cap.read()
        if not ok:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        total += float(gray.mean())
        count += 1
    cap.release()
    if count == 0:
        raise ValueError(f"No frames could be read from {video_path!r}")
    return total / count
