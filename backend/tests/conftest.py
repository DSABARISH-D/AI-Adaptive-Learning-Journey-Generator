"""Shared test fixtures."""

import pytest

from app.database import Base, engine
from app.seed import seed_courses


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables and seed before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    seed_courses()
    yield
    Base.metadata.drop_all(bind=engine)
