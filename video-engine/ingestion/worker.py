"""One thread per camera: connect -> buffer frames -> keep the HLS muxer
alive -> periodically snapshot, forward a clip to ai-engine, and heartbeat
the backend -> reconnect on failure. cv2.VideoCapture.read() is blocking, so
this runs as a plain thread rather than inside the FastAPI event loop."""
from __future__ import annotations

import logging
import threading
import time
from pathlib import Path

import httpx

from buffering.frame_buffer import FrameBuffer
from clips.writer import write_clip
from config import Settings
from processing.ai_forwarder import forward_clip
from rtsp.connection import RtspConnection
from snapshots.writer import write_snapshot
from streaming.hls_muxer import HlsMuxer

logger = logging.getLogger(__name__)


class CameraWorker:
    def __init__(self, camera: dict, settings: Settings, media_dir: Path):
        self.camera_id: str = camera["id"]
        self.camera_label: str = camera.get("name") or self.camera_id
        self.source: str = camera.get("stream_url") or settings.demo_fallback_video
        self.settings = settings

        self.connection = RtspConnection(self.source, reconnect_backoff_seconds=settings.reconnect_backoff_seconds)
        self.buffer = FrameBuffer(max_seconds=settings.frame_buffer_seconds)
        self.hls = HlsMuxer(
            self.source,
            media_dir / "live" / self.camera_id,
            segment_seconds=settings.hls_segment_seconds,
            playlist_size=settings.hls_playlist_size,
        )
        self.snapshot_dir = media_dir / "snapshots"
        self.clips_dir = media_dir / "clips"

        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._backend_client = httpx.Client(
            base_url=settings.backend_url,
            timeout=10.0,
            headers={"X-Service-Key": settings.service_api_key},
        )

    def start(self) -> None:
        self.hls.start()
        self._thread = threading.Thread(target=self._run, name=f"camera-{self.camera_id}", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=10)
        self.hls.stop()
        self.connection.release()
        self._backend_client.close()

    def _run(self) -> None:
        if not self.connection.reconnect_loop_open(self._stop):
            return

        last_snapshot = 0.0
        last_forward = 0.0
        last_heartbeat = 0.0
        frame_count = 0
        window_start = time.time()

        while not self._stop.is_set():
            self.hls.ensure_running()
            ok, frame = self.connection.read()
            if not ok:
                logger.warning("Lost frame from camera %s, reconnecting", self.camera_id)
                self.connection.release()
                if not self.connection.reconnect_loop_open(self._stop):
                    return
                continue

            self.buffer.push(frame)
            frame_count += 1
            now = time.time()

            if now - last_snapshot >= self.settings.snapshot_interval_seconds:
                self._write_snapshot(frame)
                last_snapshot = now

            if now - last_forward >= self.settings.clip_forward_interval_seconds:
                self._forward_clip()
                last_forward = now

            if now - last_heartbeat >= self.settings.camera_poll_interval_seconds:
                fps = frame_count / max(now - window_start, 0.001)
                self._heartbeat(fps)
                last_heartbeat = now
                frame_count = 0
                window_start = now

    def _write_snapshot(self, frame) -> None:
        try:
            write_snapshot(frame, self.snapshot_dir, self.camera_id)
        except Exception:
            logger.exception("Snapshot failed for camera %s", self.camera_id)

    def _forward_clip(self) -> None:
        try:
            frames = self.buffer.last_seconds(self.settings.clip_forward_interval_seconds)
            if not frames:
                return
            fps = max(len(frames) / self.settings.clip_forward_interval_seconds, 1.0)
            clip_path = write_clip(frames, self.clips_dir, self.camera_id, fps=fps)
            if clip_path is None:
                return
            try:
                forward_clip(
                    self.settings.ai_engine_url,
                    self.settings.service_api_key,
                    self.camera_id,
                    self.camera_label,
                    clip_path,
                )
            finally:
                clip_path.unlink(missing_ok=True)
        except Exception:
            logger.exception("Clip forwarding failed for camera %s", self.camera_id)

    def _heartbeat(self, fps: float) -> None:
        try:
            self._backend_client.post(
                f"/api/v1/internal/cameras/{self.camera_id}/heartbeat",
                json={"status": "ONLINE", "fps": round(fps, 2)},
            )
        except httpx.HTTPError:
            logger.warning("Heartbeat failed for camera %s", self.camera_id)
