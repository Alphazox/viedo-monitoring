"""Synthesizes short walking-silhouette videos so the gait and activity
demos can be exercised end-to-end without a real dataset or real camera
footage. Not a substitute for real gait/activity footage — see
embeddings/__init__.py for what these demos do and don't prove.

This is the same generator logic as the standalone root-level
scripts/make_demo_videos.py (kept as a separate, dependency-free copy there
so it can be run without the ai-engine service or its venv) — used here so
the service's own demo endpoints (POST /gait/demo/run, /gait/demo/seed-gallery,
/activity/demo/run) are self-sufficient and generate their clips on the fly
into DEMO_DATA_DIR rather than requiring a separate manual script run first.
"""

from pathlib import Path

import cv2
import numpy as np

from inference.video_utils import transcode_to_h264

WIDTH, HEIGHT, FPS, DURATION_S = 320, 240, 24, 3

# Mean-brightness targets that straddle events/activity_rules.py's
# NIGHT_BRIGHTNESS_THRESHOLD (60) — background pixels dominate the frame, so
# the walker's own white pixels barely shift the average.
NIGHT_BACKGROUND = 15
DAY_BACKGROUND = 140

# Varied gait parameters so each seeded profile has a genuinely distinct GEI
# (stride length, vertical bounce, limb length) — not just relabeled copies
# of the same walk. No real suspect data exists to seed with.
SUSPECT_PROFILES = [
    {"label": "Suspect #1 (Auto-seeded)", "stride": 30, "bounce": 4, "limb_len": 58},
    {"label": "Suspect #2 (Auto-seeded)", "stride": 12, "bounce": 16, "limb_len": 38},
    {"label": "Suspect #3 (Auto-seeded)", "stride": 22, "bounce": 10, "limb_len": 48},
    {"label": "Suspect #4 (Auto-seeded)", "stride": 34, "bounce": 3, "limb_len": 62},
    {"label": "Suspect #5 (Auto-seeded)", "stride": 18, "bounce": 8, "limb_len": 44},
]


def _draw_walker(frame: np.ndarray, t: float, center_x: int, stride: float, bounce: float, limb_len: int) -> None:
    """Draws a solid-bodied (not thin-line) figure — background subtraction
    needs a contiguous blob with real area to survive noise filtering; thin
    single-pixel-wide strokes get wiped out by the median blur in
    embeddings/silhouette.py's extract_silhouettes."""
    cy = HEIGHT // 2 + int(bounce * abs(np.sin(t * 2)))
    torso_top = (center_x, cy - 40)
    torso_bottom = (center_x, cy)
    swing = int(stride * np.sin(t))
    white = (255, 255, 255)

    # Thick limbs (filled by the line's own width, ~20-26px) so each contour
    # has enough area to clear MIN_SILHOUETTE_AREA after blur/erosion.
    cv2.line(frame, torso_bottom, (center_x + swing, cy + limb_len), white, 22)
    cv2.line(frame, torso_bottom, (center_x - swing, cy + limb_len), white, 22)
    cv2.line(frame, torso_top, (center_x - swing, cy - 10), white, 16)
    cv2.line(frame, torso_top, (center_x + swing, cy - 10), white, 16)

    # Solid torso (filled rounded rectangle via a thick line) and head.
    cv2.line(frame, torso_top, torso_bottom, white, 30)
    cv2.circle(frame, (center_x, cy - 55), 18, white, -1)


def generate(path: Path, stride: float, bounce: float, limb_len: int, duration_s: int = DURATION_S) -> None:
    """Subject walks laterally left-to-right across the frame — the standard
    side-view gait capture setup (as in CASIA-B). This also matters for the
    demo's background subtraction: a subject oscillating in a fixed spot gets
    learned into MOG2's per-pixel background model within ~20 frames since
    the same pixels are repeatedly covered; translating across the frame
    keeps every pixel's foreground occupancy brief, so it stays foreground.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
    n_frames = FPS * duration_s
    margin = 50
    for i in range(n_frames):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        t = i / FPS * 4  # gait cycle speed
        center_x = int(margin + (WIDTH - 2 * margin) * (i / (n_frames - 1)))
        _draw_walker(frame, t, center_x, stride, bounce, limb_len)
        writer.write(frame)
    writer.release()
    transcode_to_h264(path)


def split_video(path: Path, out_a: Path, out_b: Path) -> None:
    """Splits one video into two halves by frame count — lets the alert demo
    enroll from and later "watch" against literally one source clip."""
    cap = cv2.VideoCapture(str(path))
    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    cap.release()

    midpoint = len(frames) // 2
    for out_path, chunk in [(out_a, frames[:midpoint]), (out_b, frames[midpoint:])]:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
        for frame in chunk:
            writer.write(frame)
        writer.release()
        transcode_to_h264(out_path)


def _write_scenario_video(
    path: Path, frame_centers_x: list[int], background_level: int, stride: float, bounce: float, limb_len: int
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
    for i, center_x in enumerate(frame_centers_x):
        frame = np.full((HEIGHT, WIDTH, 3), background_level, dtype=np.uint8)
        t = i / FPS * 4
        _draw_walker(frame, t, center_x, stride, bounce, limb_len)
        writer.write(frame)
    writer.release()
    transcode_to_h264(path)


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
    _write_scenario_video(path, approach + loiter, background_level, stride=24, bounce=5, limb_len=50)


def generate_walk_past(path: Path, background_level: int, duration_s: int = 4) -> None:
    """Walker crosses the whole frame at a steady pace without stopping near
    the entrance — the "just passing through" contrast case."""
    n_frames = FPS * duration_s
    margin = 30
    frame_centers_x = [int(margin + (WIDTH - 2 * margin) * (i / (n_frames - 1))) for i in range(n_frames)]
    _write_scenario_video(path, frame_centers_x, background_level, stride=28, bounce=6, limb_len=55)


def generate_demo_set(out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    videos = {
        # Same "subject" (near-identical gait params) across two clips...
        "subject_a_walk1": (out_dir / "subject_a_walk1.mp4", dict(stride=28, bounce=6, limb_len=55)),
        "subject_a_walk2": (out_dir / "subject_a_walk2.mp4", dict(stride=27, bounce=6, limb_len=54)),
        # ...vs. a clearly different gait (short choppy stride, big bounce).
        "subject_b_walk1": (out_dir / "subject_b_walk1.mp4", dict(stride=14, bounce=14, limb_len=40)),
    }
    for path, params in videos.values():
        generate(path, **params)
    return {name: path for name, (path, _params) in videos.items()}
