"""Tests for course catalog and enrollment endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class _DummyResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


def _login(monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setattr(
        "app.auth.httpx.post",
        lambda *_args, **_kwargs: _DummyResponse({"id_token": "dummy.token", "access_token": "token"}),
    )
    monkeypatch.setattr(
        "app.auth.httpx.get",
        lambda *_args, **_kwargs: _DummyResponse({
            "email": "student@example.com",
            "name": "Student User",
            "picture": "https://example.com/avatar.png",
            "sub": "google-123",
        }),
    )
    response = client.get("/api/auth/google/callback?code=test-code&state=test-state&format=json")
    return response.json()["token"]


# ── Course catalog tests ────────────────────────────────────────────────────

def test_list_courses() -> None:
    response = client.get("/api/courses")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert any(item["code"] == "python" for item in payload)


def test_course_detail_includes_topics() -> None:
    response = client.get("/api/courses/python")
    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == "python"
    assert len(payload["topics"]) > 0
    assert payload["topics"][0]["title"]


def test_course_not_found() -> None:
    response = client.get("/api/courses/nonexistent")
    assert response.status_code == 404


# ── Enrollment tests ────────────────────────────────────────────────────────

def test_enroll_course_requires_auth() -> None:
    response = client.post("/api/courses/python/enroll")
    assert response.status_code == 401


def test_enroll_course_and_list_enrollments(monkeypatch: pytest.MonkeyPatch) -> None:
    token = _login(monkeypatch)

    enroll_response = client.post(
        "/api/courses/python/enroll",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert enroll_response.status_code == 200
    assert enroll_response.json()["course_code"] == "python"

    list_response = client.get(
        "/api/enrollments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    data = list_response.json()
    assert any(item["course_code"] == "python" for item in data)
