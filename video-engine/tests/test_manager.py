from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest

import ingestion.manager as manager_module
from config import Settings
from ingestion.manager import IngestionManager


class FakeWorker:
    instances: list[FakeWorker] = []

    def __init__(self, camera: dict, settings, media_dir: Path):
        self.camera = camera
        self.started = False
        self.stopped = False
        FakeWorker.instances.append(self)

    def start(self) -> None:
        self.started = True

    def stop(self) -> None:
        self.stopped = True


@pytest.fixture(autouse=True)
def _reset_fake_workers():
    FakeWorker.instances = []
    yield
    FakeWorker.instances = []


@pytest.fixture()
def manager(tmp_path, monkeypatch) -> IngestionManager:
    monkeypatch.setattr(manager_module, "CameraWorker", FakeWorker)
    settings = Settings(BACKEND_URL="http://backend.invalid", SERVICE_API_KEY="test-key")
    return IngestionManager(settings, tmp_path)


def test_reconcile_starts_a_worker_per_enabled_camera(manager):
    cameras = [{"id": "cam-1", "name": "Front Door", "enabled": True}]
    manager.reconcile(cameras)

    assert manager.worker_count() == 1
    assert FakeWorker.instances[0].started is True


def test_reconcile_stops_worker_for_removed_camera(manager):
    manager.reconcile([{"id": "cam-1", "name": "Front Door", "enabled": True}])
    manager.reconcile([])  # camera no longer returned by the backend

    assert manager.worker_count() == 0
    assert FakeWorker.instances[0].stopped is True


def test_reconcile_is_idempotent_for_unchanged_cameras(manager):
    cameras = [{"id": "cam-1", "name": "Front Door", "enabled": True}]
    manager.reconcile(cameras)
    manager.reconcile(cameras)

    assert manager.worker_count() == 1
    assert len(FakeWorker.instances) == 1  # not recreated


def test_fetch_cameras_only_returns_enabled(manager, monkeypatch):
    response = MagicMock()
    response.json.return_value = {
        "items": [
            {"id": "cam-1", "name": "A", "enabled": True},
            {"id": "cam-2", "name": "B", "enabled": False},
        ]
    }
    response.raise_for_status = MagicMock()
    monkeypatch.setattr(manager_module.httpx, "get", MagicMock(return_value=response))

    cameras = manager.fetch_cameras()

    assert [c["id"] for c in cameras] == ["cam-1"]


def test_fetch_cameras_returns_empty_list_on_backend_error(manager, monkeypatch):
    import httpx

    monkeypatch.setattr(manager_module.httpx, "get", MagicMock(side_effect=httpx.ConnectError("down")))

    assert manager.fetch_cameras() == []
