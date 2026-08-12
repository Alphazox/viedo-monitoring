"""Synthesizes 'approach a closed premises' scenarios for the
suspicious-activity demo: a walker approaches a fixed entrance point and
either lingers there (loitering) or keeps moving past it, under either a
dark ("night") or bright ("day") background — see app/activity/rules.py for
how these two signals combine into a suspicion flag.
"""

from pathlib import Path

import cv2
import numpy as np

from scripts.make_demo_gait_videos import FPS, HEIGHT, WIDTH, _draw_walker, _transcode_to_h264

# Mean-brightness targets that straddle app/activity/rules.py's
# NIGHT_BRIGHTNESS_THRESHOLD (60) — background pixels dominate the frame, so
# the walker's own white pixels barely shift the average.
NIGHT_BACKGROUND = 15
DAY_BACKGROUND = 140


def _write_video(
    path: Path, frame_centers_x: list[int], background_level: int, stride: float, bounce: float, limb_len: int
) -> None:
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
    for i, center_x in enumerate(frame_centers_x):
        frame = np.full((HEIGHT, WIDTH, 3), background_level, dtype=np.uint8)
        t = i / FPS * 4
        _draw_walker(frame, t, center_x, stride, bounce, limb_len)
        writer.write(frame)
    writer.release()
    _transcode_to_h264(path)


def generate_approach_and_loiter(
    path: Path,
    background_level: int,
    target_x: int = 260,
    approach_frames: int = 48,
    loiter_frames: int = 60,
) -> None:
    """Walker approaches `target_x` (the entrance) then lingers there with
    only small jitter — the "loitering" scenario."""
    rng = np.random.default_rng(42)
    start_x = 40
    approach = [int(start_x + (target_x - start_x) * (i / approach_frames)) for i in range(approach_frames)]
    loiter = [target_x + int(rng.integers(-4, 5)) for _ in range(loiter_frames)]
    _write_video(path, approach + loiter, background_level, stride=24, bounce=5, limb_len=50)


def generate_walk_past(path: Path, background_level: int, duration_s: int = 4) -> None:
    """Walker crosses the whole frame at a steady pace without stopping near
    the entrance — the "just passing through" contrast case."""
    n_frames = FPS * duration_s
    margin = 30
    frame_centers_x = [int(margin + (WIDTH - 2 * margin) * (i / (n_frames - 1))) for i in range(n_frames)]
    _write_video(path, frame_centers_x, background_level, stride=28, bounce=6, limb_len=55)
