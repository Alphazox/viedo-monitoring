import cv2
import numpy as np

MIN_SILHOUETTE_AREA = 300
MIN_VALID_FRAMES = 5


def read_video_frames(video_path: str, max_frames: int = 90) -> list[np.ndarray]:
    """Reads up to `max_frames` frames from a video file, in order."""
    cap = cv2.VideoCapture(video_path)
    frames = []
    while len(frames) < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    cap.release()

    if not frames:
        raise ValueError(f"No frames could be read from {video_path!r}")
    return frames


def extract_silhouettes(frames: list[np.ndarray]) -> list[np.ndarray]:
    """Returns one binary silhouette mask per input frame.

    Two passes over the same frames: the first lets MOG2 learn the
    background, the second (learning frozen) extracts the foreground
    subject as the largest connected contour. `frames` is either a whole
    video (legacy whole-frame path) or one tracked person's cropped-bbox
    sequence (inference/pipeline.py) — the algorithm doesn't care which,
    though it's markedly more reliable on a tight single-person crop than a
    whole frame that may contain background clutter or nobody at all.
    """
    if not frames:
        raise ValueError("No frames to extract silhouettes from")

    bg_subtractor = cv2.createBackgroundSubtractorMOG2(
        history=len(frames), varThreshold=25, detectShadows=False
    )
    for frame in frames:
        bg_subtractor.apply(frame, learningRate=0.05)

    silhouettes: list[np.ndarray] = []
    for frame in frames:
        mask = bg_subtractor.apply(frame, learningRate=0)
        mask = cv2.medianBlur(mask, 5)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        largest = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest) < MIN_SILHOUETTE_AREA:
            continue
        person_mask = np.zeros_like(mask)
        cv2.drawContours(person_mask, [largest], -1, 255, thickness=cv2.FILLED)
        silhouettes.append(person_mask)

    if len(silhouettes) < MIN_VALID_FRAMES:
        raise ValueError(
            "Could not extract enough silhouette frames from this video "
            f"(got {len(silhouettes)}, need {MIN_VALID_FRAMES}) — the subject may be "
            "too static, off-frame, or the clip too short/noisy for background subtraction."
        )
    return silhouettes
