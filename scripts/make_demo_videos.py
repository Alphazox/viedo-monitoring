"""Standalone CLI: synthesizes short walking-silhouette demo videos (no real
camera footage or dataset required) into storage/demo-videos/.

This is a self-contained copy of the same generator logic used internally by
the ai-engine service (ai-engine/inference/demo_videos.py) so it can be run
from the repo root without installing or importing the ai-engine package —
just needs opencv-python(-headless) + numpy on whatever Python runs it (the
ai-engine venv works fine: `ai-engine/.venv/Scripts/python scripts/make_demo_videos.py`).

The ai-engine service's own demo endpoints (POST /gait/demo/run,
/gait/demo/seed-gallery, /activity/demo/run) do NOT depend on this script —
they generate their own clips on the fly into their own DEMO_DATA_DIR. This
script is a separate, manual way to populate the repo's root storage/
directory with the same kind of synthetic clips, e.g. for eyeballing them
directly or feeding them into other parts of the platform.

Usage:
    python scripts/make_demo_videos.py
"""

import subprocess
from pathlib import Path

import cv2
import numpy as np

WIDTH, HEIGHT, FPS, DURATION_S = 320, 240, 24, 3
NIGHT_BACKGROUND = 15
DAY_BACKGROUND = 140

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "storage" / "demo-videos"


def _transcode_to_h264(path: Path) -> None:
    """cv2.VideoWriter's `mp4v` fourcc isn't decodable by browsers — re-encode
    to H.264 in place via ffmpeg (opencv-python-headless has no libx264
    encoder). Leaves the mp4v file in place if ffmpeg isn't on PATH."""
    tmp = path.with_suffix(".h264.mp4")
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(path),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                str(tmp),
            ],
            check=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        tmp.unlink(missing_ok=True)
        return
    tmp.replace(path)


def _draw_walker(frame: np.ndarray, t: float, center_x: int, stride: float, bounce: float, limb_len: int) -> None:
    cy = HEIGHT // 2 + int(bounce * abs(np.sin(t * 2)))
    torso_top = (center_x, cy - 40)
    torso_bottom = (center_x, cy)
    swing = int(stride * np.sin(t))
    white = (255, 255, 255)

    cv2.line(frame, torso_bottom, (center_x + swing, cy + limb_len), white, 22)
    cv2.line(frame, torso_bottom, (center_x - swing, cy + limb_len), white, 22)
    cv2.line(frame, torso_top, (center_x - swing, cy - 10), white, 16)
    cv2.line(frame, torso_top, (center_x + swing, cy - 10), white, 16)
    cv2.line(frame, torso_top, torso_bottom, white, 30)
    cv2.circle(frame, (center_x, cy - 55), 18, white, -1)


def generate(path: Path, stride: float, bounce: float, limb_len: int, duration_s: int = DURATION_S) -> None:
    """Subject walks laterally left-to-right across the frame (side-view
    gait capture, as in CASIA-B)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
    n_frames = FPS * duration_s
    margin = 50
    for i in range(n_frames):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        t = i / FPS * 4
        center_x = int(margin + (WIDTH - 2 * margin) * (i / (n_frames - 1)))
        _draw_walker(frame, t, center_x, stride, bounce, limb_len)
        writer.write(frame)
    writer.release()
    _transcode_to_h264(path)


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
    _transcode_to_h264(path)


def generate_approach_and_loiter(
    path: Path, background_level: int, target_x: int = 260, approach_frames: int = 48, loiter_frames: int = 60
) -> None:
    rng = np.random.default_rng(42)
    start_x = 40
    approach = [int(start_x + (target_x - start_x) * (i / approach_frames)) for i in range(approach_frames)]
    loiter = [target_x + int(rng.integers(-4, 5)) for _ in range(loiter_frames)]
    _write_scenario_video(path, approach + loiter, background_level, stride=24, bounce=5, limb_len=50)


def generate_walk_past(path: Path, background_level: int, duration_s: int = 4) -> None:
    n_frames = FPS * duration_s
    margin = 30
    frame_centers_x = [int(margin + (WIDTH - 2 * margin) * (i / (n_frames - 1))) for i in range(n_frames)]
    _write_scenario_video(path, frame_centers_x, background_level, stride=28, bounce=6, limb_len=55)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    gait_videos = {
        "subject_a_walk1.mp4": dict(stride=28, bounce=6, limb_len=55),
        "subject_a_walk2.mp4": dict(stride=27, bounce=6, limb_len=54),
        "subject_b_walk1.mp4": dict(stride=14, bounce=14, limb_len=40),
    }
    for name, params in gait_videos.items():
        path = OUTPUT_DIR / name
        generate(path, **params)
        print(f"wrote {path}")

    night_loiter = OUTPUT_DIR / "activity_night_loiter.mp4"
    generate_approach_and_loiter(night_loiter, background_level=NIGHT_BACKGROUND)
    print(f"wrote {night_loiter}")

    night_walkby = OUTPUT_DIR / "activity_night_walkby.mp4"
    generate_walk_past(night_walkby, background_level=NIGHT_BACKGROUND)
    print(f"wrote {night_walkby}")

    day_loiter = OUTPUT_DIR / "activity_day_loiter.mp4"
    generate_approach_and_loiter(day_loiter, background_level=DAY_BACKGROUND)
    print(f"wrote {day_loiter}")


if __name__ == "__main__":
    main()
