from __future__ import annotations

from pathlib import Path

import pytest

SAMPLE_CLIP = Path(__file__).resolve().parents[2] / "storage" / "uploads" / "sample-walking-realistic.mp4"


def test_ingest_clip_requires_service_key(client):
    res = client.post("/pipeline/ingest-clip", data={"camera_id": "cam-1"})
    assert res.status_code == 401


def test_ingest_clip_rejects_wrong_service_key(client):
    res = client.post(
        "/pipeline/ingest-clip",
        data={"camera_id": "cam-1"},
        headers={"X-Service-Key": "not-the-right-key"},
    )
    assert res.status_code == 401


def test_ingest_clip_rejects_empty_upload(client, service_headers):
    res = client.post(
        "/pipeline/ingest-clip",
        data={"camera_id": "cam-1"},
        files={"video": ("empty.mp4", b"", "video/mp4")},
        headers=service_headers,
    )
    assert res.status_code == 400


@pytest.mark.skipif(not SAMPLE_CLIP.exists(), reason="sample clip not present in this checkout")
def test_ingest_clip_end_to_end_with_real_clip(client, service_headers):
    with SAMPLE_CLIP.open("rb") as f:
        res = client.post(
            "/pipeline/ingest-clip",
            data={"camera_id": "cam-1", "camera_label": "Front Door"},
            files={"video": ("clip.mp4", f, "video/mp4")},
            headers=service_headers,
        )
    assert res.status_code == 200
    body = res.json()
    assert body["camera_id"] == "cam-1"
    assert "activity_alert" in body
    assert "fall_alert" in body
