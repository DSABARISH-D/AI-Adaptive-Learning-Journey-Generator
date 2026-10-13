"""Regression tests for production safety settings."""

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_production_rejects_development_jwt_secret():
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(
            app_env="production",
            jwt_secret="dev-secret",
            enable_unsafe_code_runner=False,
        )


def test_production_rejects_in_process_code_runner():
    with pytest.raises(ValidationError, match="ENABLE_UNSAFE_CODE_RUNNER"):
        Settings(
            app_env="production",
            jwt_secret="a-long-test-only-secret-with-more-than-thirty-two-characters",
            enable_unsafe_code_runner=True,
        )


def test_production_accepts_safe_runner_configuration():
    config = Settings(
        app_env="production",
        jwt_secret="a-long-test-only-secret-with-more-than-thirty-two-characters",
        enable_unsafe_code_runner=False,
    )
    assert config.app_env == "production"
    assert config.enable_unsafe_code_runner is False
