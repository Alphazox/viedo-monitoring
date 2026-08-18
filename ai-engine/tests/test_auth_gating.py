from __future__ import annotations

from inference.config import get_settings


def test_health_routes_stay_open(client):
    assert client.get("/health/live").status_code == 200
    assert client.get("/health/ready").status_code == 200


def test_alerts_requires_auth(client):
    res = client.get("/alerts")
    assert res.status_code in (401, 403)


def test_alerts_with_valid_token_succeeds(client, auth_headers):
    res = client.get("/alerts", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert "items" in body and "total" in body


def test_gallery_requires_auth(client):
    res = client.get("/gait/gallery")
    assert res.status_code in (401, 403)


def test_detection_annotate_requires_auth(client):
    res = client.post("/detection/annotate")
    # No auth header at all -> rejected before FastAPI even complains about the missing file.
    assert res.status_code in (401, 403)


def test_invalid_token_rejected(client):
    res = client.get("/alerts", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401


def test_demo_routes_available_outside_production(client, auth_headers, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "env", "development")
    res = client.post("/detection/demo/run", headers=auth_headers)
    # No demo sample bundled in this checkout -> 404 "place a sample" message,
    # not the production-gating 404 -- distinguish by response body.
    assert res.status_code == 404
    assert "demo sample" in res.json()["detail"]


def test_demo_routes_404_in_production(client, auth_headers, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "env", "production")
    for method, path in [
        ("post", "/detection/demo/run"),
        ("post", "/activity/demo/run"),
        ("post", "/gait/demo/run"),
        ("post", "/gait/demo/seed-gallery"),
        ("post", "/fall/demo/run"),
    ]:
        res = getattr(client, method)(path, headers=auth_headers)
        assert res.status_code == 404
        assert res.json()["detail"] == "Not found"
