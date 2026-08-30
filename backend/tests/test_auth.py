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


def test_google_login_returns_auth_url() -> None:
    response = client.get('/api/auth/google/login')

    assert response.status_code == 200
    payload = response.json()
    assert 'auth_url' in payload
    assert 'accounts.google.com' in payload['auth_url']


def test_google_callback_issues_jwt(monkeypatch: pytest.MonkeyPatch) -> None:
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
    monkeypatch.setattr('app.auth.httpx.get', lambda *args, **kwargs: DummyResponse({'email': 'student@example.com', 'name': 'Student User'}))

    response = client.get('/api/auth/google/callback?code=test-code&state=test-state')

    assert response.status_code == 200
    payload = response.json()
    assert 'token' in payload
    assert payload['user']['email'] == 'student@example.com'


def test_profile_requires_auth() -> None:
    response = client.get('/api/profile')

    assert response.status_code == 401


def test_profile_crud_success(monkeypatch: pytest.MonkeyPatch) -> None:
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
    monkeypatch.setattr('app.auth.httpx.get', lambda *args, **kwargs: DummyResponse({'email': 'student@example.com', 'name': 'Ada Student', 'picture': 'https://example.com/avatar.png', 'sub': 'google-123'}))

    login_response = client.get('/api/auth/google/login')
    login_url = login_response.json()['auth_url']
    assert 'accounts.google.com' in login_url

    token_response = client.get('/api/auth/google/callback?code=test-code&state=test-state')
    token = token_response.json()['token']

    profile_response = client.get(
        '/api/profile',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert profile_response.status_code == 200

    update_response = client.put(
        '/api/profile',
        headers={'Authorization': f'Bearer {token}'},
        json={'preferred_name': 'Ada', 'learning_goals': ['Python'], 'interests': ['AI'], 'current_level': 'beginner'},
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data['preferred_name'] == 'Ada'
    assert data['learning_goals'] == ['Python']
