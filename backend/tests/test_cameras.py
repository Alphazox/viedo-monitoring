from __future__ import annotations


def _auth_headers(client, user, user_password) -> dict[str, str]:
    res = client.post("/api/v1/auth/login", json={"email": user.email, "password": user_password})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_create_and_list_camera(client, user, user_password):
    headers = _auth_headers(client, user, user_password)

    create_res = client.post(
        "/api/v1/cameras",
        json={"name": "Front Door", "stream_type": "RTSP", "stream_url": "rtsp://example.invalid/stream"},
        headers=headers,
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == "Front Door"
    # stream_url is never echoed back to the browser, even to the org that owns it.
    assert "stream_url" not in created

    list_res = client.get("/api/v1/cameras", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1


def test_camera_crud_is_scoped_to_organization(client, user, user_password, other_org_camera):
    headers = _auth_headers(client, user, user_password)

    update_res = client.patch(
        f"/api/v1/cameras/{other_org_camera.id}", json={"name": "Hijacked"}, headers=headers
    )
    assert update_res.status_code == 404

    delete_res = client.delete(f"/api/v1/cameras/{other_org_camera.id}", headers=headers)
    assert delete_res.status_code == 404

    list_res = client.get("/api/v1/cameras", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 0


def test_cameras_require_auth(client):
    res = client.get("/api/v1/cameras")
    assert res.status_code in (401, 403)
