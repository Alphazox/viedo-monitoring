"""Synthesizes short walking-silhouette videos so the gait demo can be
exercised end-to-end without a real dataset. Not a substitute for real gait
footage — see app/gait/__init__.py for what the demo does and doesn't prove.
"""

import subprocess
from pathlib import Path

import cv2
import numpy as np

WIDTH, HEIGHT, FPS, DURATION_S = 320, 240, 24, 3


def _transcode_to_h264(path: Path) -> None:
    """cv2.VideoWriter's `mp4v` fourcc (MPEG-4 Part 2) is fine for OpenCV to
    read back for analysis, but browsers' <video> element won't decode it —
    re-encode to H.264 in place so the same clip is also playable in the
    demo UI. opencv-python-headless has no libx264 encoder itself (patent-
    encumbered, not bundled in the pip wheel), hence shelling out to ffmpeg.
    """
    tmp = path.with_suffix(".h264.mp4")
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(path),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(tmp),
        ],
        check=True,
    )
    tmp.replace(path)


def _draw_walker(frame: np.ndarray, t: float, center_x: int, stride: float, bounce: float, limb_len: int) -> None:
    """Draws a solid-bodied (not thin-line) figure — background subtraction
    needs a contiguous blob with real area to survive noise filtering; thin
    single-pixel-wide strokes get wiped out by the median blur in
    silhouette.extract_silhouettes."""
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
    _transcode_to_h264(path)


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
        writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))
        for frame in chunk:
            writer.write(frame)
        writer.release()
        _transcode_to_h264(out_path)


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


if __name__ == "__main__":
    target_dir = Path(__file__).resolve().parent.parent / "data" / "demo_videos"
    written = generate_demo_set(target_dir)
    for name, path in written.items():
        print(f"{name}: {path}")
