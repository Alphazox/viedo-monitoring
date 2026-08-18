"""One ffmpeg subprocess per camera, transcoding the RTSP (or looped demo
file) source straight to an HLS playlist. Segments are deliberately NOT
deleted as they fall out of the live playlist window (no `delete_segments`
flag) so recent history stays on disk for clip extraction — sweeper.py
bounds disk usage on a longer retention window instead."""
from __future__ import annotations

import logging
import subprocess
from pathlib import Path

from rtsp.connection import is_rtsp_source

logger = logging.getLogger(__name__)


class HlsMuxer:
    def __init__(self, source: str, output_dir: Path, segment_seconds: int = 4, playlist_size: int = 6):
        self.source = source
        self.output_dir = output_dir
        self.segment_seconds = segment_seconds
        self.playlist_size = playlist_size
        self._process: subprocess.Popen | None = None

    def build_command(self) -> list[str]:
        input_args = ["-rtsp_transport", "tcp"] if is_rtsp_source(self.source) else ["-stream_loop", "-1"]
        return [
            "ffmpeg",
            "-y",
            "-loglevel",
            "warning",
            *input_args,
            "-i",
            self.source,
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-tune",
            "zerolatency",
            "-f",
            "hls",
            "-hls_time",
            str(self.segment_seconds),
            "-hls_list_size",
            str(self.playlist_size),
            "-hls_flags",
            "independent_segments+program_date_time",
            "-hls_segment_filename",
            str(self.output_dir / "segment_%08d.ts"),
            str(self.output_dir / "index.m3u8"),
        ]

    def is_running(self) -> bool:
        return self._process is not None and self._process.poll() is None

    def start(self) -> None:
        if self.is_running():
            return
        self.output_dir.mkdir(parents=True, exist_ok=True)
        command = self.build_command()
        logger.info("Starting HLS muxer: %s", " ".join(command))
        self._process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def ensure_running(self) -> None:
        if not self.is_running():
            self.start()

    def stop(self) -> None:
        if self._process is None:
            return
        self._process.terminate()
        try:
            self._process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self._process.kill()
        self._process = None
