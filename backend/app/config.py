from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Adaptive Learning Journey Generator"
    database_url: str = "sqlite:///./ai_adaptive_learning.db"

    # Auth
    jwt_secret: str = "dev-secret"
    google_oauth_client_id: str = "test-client-id"
    google_oauth_client_secret: str = "test-client-secret"
    oauth_redirect_url: str = "http://localhost:8000/api/auth/google/callback"
    frontend_url: str = "http://localhost:5173"

    # AI Providers
    llm_provider: str = "openai"
    openai_api_key: str = ""
    gemini_api_key: str = ""

    # External APIs
    youtube_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
