import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db() -> None:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _login(monkeypatch: pytest.MonkeyPatch) -> str:
    class DummyResponse:
        def __init__(self, payload: dict):
            self._payload = payload

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return self._payload

    monkeypatch.setenv('GOOGLE_OAUTH_CLIENT_ID', 'client-id')
    monkeypatch.setenv('GOOGLE_OAUTH_CLIENT_SECRET', 'client-secret')
    monkeypatch.setattr(
        'app.auth.httpx.post',
        lambda *args, **kwargs: DummyResponse({'id_token': 'dummy.token', 'access_token': 'token'}),
    )
    monkeypatch.setattr(
        'app.auth.httpx.get',
        lambda *args, **kwargs: DummyResponse({'email': 'student@example.com', 'name': 'Student User', 'picture': 'https://example.com/avatar.png', 'sub': 'google-123'}),
    )

    response = client.get('/api/auth/google/callback?code=test-code&state=test-state')
    return response.json()['token']


def test_list_courses() -> None:
    response = client.get('/api/courses')

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert any(item['code'] == 'python' for item in payload)


def test_course_detail_includes_topics() -> None:
    response = client.get('/api/courses/python')

    assert response.status_code == 200
    payload = response.json()
    assert payload['code'] == 'python'
    assert len(payload['topics']) > 0
    assert payload['topics'][0]['title']


def test_enroll_course_requires_auth() -> None:
    response = client.post('/api/courses/python/enroll')

    assert response.status_code == 401


def test_enroll_course_and_list_enrollments(monkeypatch: pytest.MonkeyPatch) -> None:
    token = _login(monkeypatch)

    enroll_response = client.post('/api/courses/python/enroll', headers={'Authorization': f'Bearer {token}'})
    assert enroll_response.status_code == 200
    assert enroll_response.json()['course_code'] == 'python'

    list_response = client.get('/api/enrollments', headers={'Authorization': f'Bearer {token}'})
    assert list_response.status_code == 200
    data = list_response.json()
    assert any(item['course_code'] == 'python' for item in data)
