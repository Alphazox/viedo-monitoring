"""Discovers enabled cameras from the backend's internal API and keeps one
CameraWorker running per camera, starting/stopping workers as cameras are
added, disabled, or removed."""
from __future__ import annotations

import logging
import threading
from pathlib import Path

import httpx

from config import Settings
from ingestion.worker import CameraWorker

logger = logging.getLogger(__name__)


class IngestionManager:
    def __init__(self, settings: Settings, media_dir: Path):
        self.settings = settings
        self.media_dir = media_dir
        self._workers: dict[str, CameraWorker] = {}
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._poll_thread: threading.Thread | None = None

    def fetch_cameras(self) -> list[dict]:
        try:
            res = httpx.get(
                f"{self.settings.backend_url}/api/v1/internal/cameras",
                headers={"X-Service-Key": self.settings.service_api_key},
                timeout=10.0,
            )
            res.raise_for_status()
            return [c for c in res.json()["items"] if c["enabled"]]
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            logger.warning("Failed to fetch camera list from backend: %s", exc)
            return []

    def reconcile(self, cameras: list[dict]) -> None:
        seen = {c["id"] for c in cameras}
        to_stop: list[CameraWorker] = []
        to_start: list[CameraWorker] = []
        with self._lock:
            for camera_id in list(self._workers):
                if camera_id not in seen:
                    logger.info("Stopping worker for removed/disabled camera %s", camera_id)
                    to_stop.append(self._workers.pop(camera_id))

            for camera in cameras:
                if camera["id"] not in self._workers:
                    logger.info("Starting worker for camera %s (%s)", camera["id"], camera.get("name"))
                    worker = CameraWorker(camera, self.settings, self.media_dir)
                    to_start.append(worker)
                    self._workers[camera["id"]] = worker

        # worker.stop()/start() can block for several seconds (thread join,
        # ffmpeg teardown) -- do that outside the lock so get_worker()/
        # worker_count() (health checks, on-demand snapshot/clip triggers)
        # aren't blocked for the duration.
        for worker in to_stop:
            worker.stop()
        for worker in to_start:
            worker.start()

    def get_worker(self, camera_id: str) -> CameraWorker | None:
        with self._lock:
            return self._workers.get(camera_id)

    def worker_count(self) -> int:
        with self._lock:
            return len(self._workers)

    def _poll_loop(self) -> None:
        while not self._stop.wait(self.settings.camera_poll_interval_seconds):
            self.reconcile(self.fetch_cameras())

    def start(self) -> None:
        self.reconcile(self.fetch_cameras())
        self._poll_thread = threading.Thread(target=self._poll_loop, name="camera-manager-poll", daemon=True)
        self._poll_thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._poll_thread is not None:
            self._poll_thread.join(timeout=10)
        with self._lock:
            for worker in self._workers.values():
                worker.stop()
            self._workers.clear()
