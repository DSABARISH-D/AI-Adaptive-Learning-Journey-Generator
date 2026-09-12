"""Shared test fixtures."""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

from app.database import Base, engine
from app.seed import seed_courses


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables and seed before each test, drop after."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_courses()
    yield
    Base.metadata.drop_all(bind=engine)
