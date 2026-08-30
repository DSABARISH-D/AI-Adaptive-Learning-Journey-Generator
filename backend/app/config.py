from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Adaptive Learning Journey Generator"
    database_url: str = "sqlite:///./ai_adaptive_learning.db"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
