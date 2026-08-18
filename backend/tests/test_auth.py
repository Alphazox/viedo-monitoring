from __future__ import annotations


def test_login_success_sets_httponly_refresh_cookie_and_no_refresh_token_in_body(client, user, user_password):
    res = client.post("/api/v1/auth/login", json={"email": user.email, "password": user_password})
    assert res.status_code == 200

    body = res.json()
    assert "access_token" in body
    assert "refresh_token" not in body

    cookie = res.cookies.get("aegisvision_refresh")
    assert cookie is not None
    set_cookie_header = res.headers.get("set-cookie", "")
    assert "HttpOnly" in set_cookie_header


def test_login_wrong_password_rejected(client, user):
    res = client.post("/api/v1/auth/login", json={"email": user.email, "password": "wrong-password"})
    assert res.status_code == 401


def test_login_unknown_email_rejected(client):
    res = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever"})
    assert res.status_code == 401


def test_me_requires_valid_access_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code in (401, 403)


def test_me_returns_current_user(client, user, user_password):
    login_res = client.post("/api/v1/auth/login", json={"email": user.email, "password": user_password})
    token = login_res.json()["access_token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == user.email


def test_refresh_uses_cookie_and_rotates_it(client, user, user_password):
    login_res = client.post("/api/v1/auth/login", json={"email": user.email, "password": user_password})
    old_cookie = login_res.cookies.get("aegisvision_refresh")

    refresh_res = client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()
    assert "refresh_token" not in refresh_res.json()

    new_cookie = refresh_res.cookies.get("aegisvision_refresh")
    assert new_cookie is not None
    assert new_cookie != old_cookie


def test_refresh_without_cookie_rejected(client):
    res = client.post("/api/v1/auth/refresh")
    assert res.status_code == 401


def test_logout_clears_refresh_cookie(client, user, user_password):
    login_res = client.post("/api/v1/auth/login", json={"email": user.email, "password": user_password})
    token = login_res.json()["access_token"]

    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 204

    refresh_res = client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 401
