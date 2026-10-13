"""Security regression tests for application configuration and API error handling."""

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app


def test_production_rejects_default_jwt_secret():
    try:
        Settings(app_env="production", jwt_secret="dev-secret")
    except ValueError as exc:
        assert "JWT_SECRET" in str(exc)
    else:
        raise AssertionError("Production settings must reject the development JWT secret")


def test_production_accepts_long_unique_jwt_secret():
    settings = Settings(app_env="production", jwt_secret="test-only-secret-with-more-than-32-characters")
    assert settings.app_env == "production"


def test_health_endpoint_is_available():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
