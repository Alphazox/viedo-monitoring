from __future__ import annotations

import os
import time
from pathlib import Path

from streaming.sweeper import sweep_old_segments


def test_sweep_removes_only_stale_segments(tmp_path: Path):
    camera_dir = tmp_path / "cam-1"
    camera_dir.mkdir()

    old_segment = camera_dir / "segment_00000001.ts"
    old_segment.write_bytes(b"old")
    fresh_segment = camera_dir / "segment_00000002.ts"
    fresh_segment.write_bytes(b"fresh")

    old_time = time.time() - 3600
    os.utime(old_segment, (old_time, old_time))

    removed = sweep_old_segments(tmp_path, retention_seconds=60)

    assert removed == 1
    assert not old_segment.exists()
    assert fresh_segment.exists()


def test_sweep_on_missing_directory_is_a_noop(tmp_path: Path):
    assert sweep_old_segments(tmp_path / "does-not-exist", retention_seconds=60) == 0
