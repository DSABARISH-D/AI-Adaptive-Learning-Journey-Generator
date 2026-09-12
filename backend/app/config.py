"""Application settings and startup validation."""

from __future__ import annotations

import logging
from pathlib import Path
from urllib.parse import urlparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "AI Adaptive Learning Journey Generator"
    database_url: str = "sqlite:///./ai_adaptive_learning.db"

    # Auth
    jwt_secret: str = "dev-secret"
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""
    oauth_redirect_url: str = "http://localhost:8000/api/auth/google/callback"
    frontend_url: str = "http://localhost:5173"

    # AI Providers
    llm_provider: str = "openai"
    openai_api_key: str = ""
    gemini_api_key: str = ""

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    bedrock_model_id: str = ""
    mastery_threshold: float = 70.0

    model_config = SettingsConfigDict(
        env_file=REPOSITORY_ROOT / ".env",
        extra="ignore",
    )

    @field_validator(
        "google_oauth_client_id",
        "google_oauth_client_secret",
        "oauth_redirect_url",
        "frontend_url",
        mode="before",
    )
    @classmethod
    def normalize_oauth_values(cls, value: object) -> str:
        """Trim whitespace and accidental wrapping quotes from dotenv values."""
        normalized = "" if value is None else str(value).strip()
        if (
            len(normalized) >= 2
            and normalized[0] in {"'", '"'}
            and normalized[-1] == normalized[0]
        ):
            normalized = normalized[1:-1].strip()
        return normalized


def validate_google_oauth_settings(config: Settings) -> None:
    """Fail startup before an invalid OAuth client reaches Google."""
    missing = [
        name
        for name, value in (
            ("GOOGLE_OAUTH_CLIENT_ID", config.google_oauth_client_id),
            ("GOOGLE_OAUTH_CLIENT_SECRET", config.google_oauth_client_secret),
        )
        if not value
    ]
    if missing:
        names = " and ".join(missing)
        raise RuntimeError(
            "Google OAuth configuration error: "
            f"{names} must be set and non-empty. "
            "Add both values to the repository-root .env file before starting the backend."
        )

    quoted = [
        name
        for name, value in (
            ("GOOGLE_OAUTH_CLIENT_ID", config.google_oauth_client_id),
            ("GOOGLE_OAUTH_CLIENT_SECRET", config.google_oauth_client_secret),
        )
        if value.startswith(("'", '"')) or value.endswith(("'", '"'))
    ]
    if quoted:
        raise RuntimeError(
            "Google OAuth configuration error: "
            f"{' and '.join(quoted)} contain an unmatched quote character."
        )

    redirect_uri = urlparse(config.oauth_redirect_url)
    if redirect_uri.scheme not in {"http", "https"} or not redirect_uri.netloc:
        raise RuntimeError(
            "Google OAuth configuration error: OAUTH_REDIRECT_URL must be an absolute "
            "HTTP(S) URL, for example http://localhost:8000/api/auth/google/callback."
        )


def load_settings(**settings_kwargs: object) -> Settings:
    """Load, validate, and report non-sensitive OAuth startup configuration."""
    config = Settings(**settings_kwargs)
    try:
        validate_google_oauth_settings(config)
        logger.info("Google OAuth redirect URI: %s", config.oauth_redirect_url)
    except RuntimeError as exc:
        logger.warning(
            "Google OAuth not fully configured — Google login will be unavailable. "
            "Use the /api/auth/dev-login endpoint for local testing. Detail: %s",
            exc,
        )
    return config


settings = load_settings()
