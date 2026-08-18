from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


def write_snapshot(frame: np.ndarray, output_dir: Path, camera_id: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{camera_id}.jpg"
    ok = cv2.imwrite(str(path), frame)
    if not ok:
        raise RuntimeError(f"Failed to write snapshot for camera {camera_id}")
    return path
