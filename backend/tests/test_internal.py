from __future__ import annotations

from app.core.config import get_settings

settings = get_settings()
SERVICE_HEADERS = {"X-Service-Key": settings.SERVICE_API_KEY}


def _auth_headers(client, user, user_password) -> dict[str, str]:
    res = client.post("/api/v1/auth/login", json={"email": user.email, "password": user_password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_internal_cameras_requires_service_key(client):
    res = client.get("/api/v1/internal/cameras")
    assert res.status_code == 401


def test_internal_cameras_rejects_wrong_service_key(client):
    res = client.get("/api/v1/internal/cameras", headers={"X-Service-Key": "not-the-right-key"})
    assert res.status_code == 401


def test_internal_cameras_exposes_unmasked_stream_url(client, user, user_password):
    headers = _auth_headers(client, user, user_password)
    client.post(
        "/api/v1/cameras",
        json={"name": "Loading Dock", "stream_type": "RTSP", "stream_url": "rtsp://user:pass@10.0.0.5/live"},
        headers=headers,
    )

    res = client.get("/api/v1/internal/cameras", headers=SERVICE_HEADERS)
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(c["stream_url"] == "rtsp://user:pass@10.0.0.5/live" for c in items)


def test_heartbeat_updates_camera_status_and_fps(client, user, user_password):
    headers = _auth_headers(client, user, user_password)
    create_res = client.post("/api/v1/cameras", json={"name": "Parking Lot"}, headers=headers)
    camera_id = create_res.json()["id"]

    hb_res = client.post(
        f"/api/v1/internal/cameras/{camera_id}/heartbeat",
        json={"status": "ONLINE", "fps": 24.5},
        headers=SERVICE_HEADERS,
    )
    assert hb_res.status_code == 204

    list_res = client.get("/api/v1/cameras", headers=headers)
    updated = next(c for c in list_res.json()["items"] if c["id"] == camera_id)
    assert updated["status"] == "ONLINE"
    assert updated["fps"] == 24.5


def test_heartbeat_requires_service_key(client, user, user_password):
    headers = _auth_headers(client, user, user_password)
    create_res = client.post("/api/v1/cameras", json={"name": "Rear Exit"}, headers=headers)
    camera_id = create_res.json()["id"]

    res = client.post(f"/api/v1/internal/cameras/{camera_id}/heartbeat", json={"status": "ONLINE"})
    assert res.status_code == 401


def test_heartbeat_unknown_camera_404s(client):
    import uuid

    res = client.post(
        f"/api/v1/internal/cameras/{uuid.uuid4()}/heartbeat",
        json={"status": "ONLINE"},
        headers=SERVICE_HEADERS,
    )
    assert res.status_code == 404
