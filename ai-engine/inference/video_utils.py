"""Shared video I/O helpers used by both the synthetic demo-clip generator
(inference/demo_videos.py) and the real-detection annotate/visualize paths
(inference/annotate.py, inference/visualize.py).
"""

import subprocess
from pathlib import Path


def transcode_to_h264(path: Path) -> None:
    """cv2.VideoWriter's `mp4v` fourcc (MPEG-4 Part 2) is fine for OpenCV to
    read back for analysis, but browsers' <video> element won't decode it —
    re-encode to H.264 in place so the same clip is also playable in a demo
    UI. opencv-python-headless has no libx264 encoder itself (patent-
    encumbered, not bundled in the pip wheel), hence shelling out to ffmpeg.

    If ffmpeg isn't on PATH, the original mp4v file is left in place rather
    than raising — analysis (OpenCV can still read mp4v) keeps working, only
    browser playback would be degraded.
    """
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
