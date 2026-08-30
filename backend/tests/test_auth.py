"""Tests for authentication endpoints and profile CRUD."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class _DummyResponse:
    """Fake httpx response for mocking Google OAuth calls."""

    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


def _mock_google(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch httpx so Google OAuth calls return canned data."""
    monkeypatch.setattr(
        "app.auth.httpx.post",
        lambda *_args, **_kwargs: _DummyResponse({"id_token": "dummy.token", "access_token": "token"}),
    )
    monkeypatch.setattr(
        "app.auth.httpx.get",
        lambda *_args, **_kwargs: _DummyResponse({
            "email": "student@example.com",
            "name": "Ada Student",
            "picture": "https://example.com/avatar.png",
            "sub": "google-123",
        }),
    )


def _get_token(monkeypatch: pytest.MonkeyPatch) -> str:
    """Log in via the mocked callback and return a JWT."""
    _mock_google(monkeypatch)
    response = client.get("/api/auth/google/callback?code=test-code&state=test-state&format=json")
    assert response.status_code == 200
    return response.json()["token"]


# ── Auth endpoint tests ─────────────────────────────────────────────────────

def test_google_login_returns_auth_url() -> None:
    response = client.get("/api/auth/google/login")
    assert response.status_code == 200
    payload = response.json()
    assert "auth_url" in payload
    assert "accounts.google.com" in payload["auth_url"]


def test_google_callback_issues_jwt(monkeypatch: pytest.MonkeyPatch) -> None:
    _mock_google(monkeypatch)
    response = client.get("/api/auth/google/callback?code=test-code&state=test-state&format=json")
    assert response.status_code == 200
    payload = response.json()
    assert "token" in payload
    assert payload["user"]["email"] == "student@example.com"


def test_google_callback_redirects(monkeypatch: pytest.MonkeyPatch) -> None:
    _mock_google(monkeypatch)
    response = client.get(
        "/api/auth/google/callback?code=test-code&state=test-state",
        follow_redirects=False,
    )
    assert response.status_code == 307
    assert "token=" in response.headers["location"]
    assert "user=" in response.headers["location"]


# ── Profile tests ───────────────────────────────────────────────────────────

def test_profile_requires_auth() -> None:
    response = client.get("/api/profile")
    assert response.status_code == 401


def test_profile_crud_success(monkeypatch: pytest.MonkeyPatch) -> None:
    token = _get_token(monkeypatch)

    # GET profile before creation
    get_resp = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert get_resp.status_code == 404

    # PUT profile
    put_resp = client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "preferred_name": "Ada",
            "learning_goals": ["Python"],
            "interests": ["AI"],
            "current_level": "beginner",
        },
    )
    assert put_resp.status_code == 200
    data = put_resp.json()
    assert data["preferred_name"] == "Ada"
    assert data["learning_goals"] == ["Python"]
