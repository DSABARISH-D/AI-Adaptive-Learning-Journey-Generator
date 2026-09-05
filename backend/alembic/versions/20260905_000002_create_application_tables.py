"""create application tables

Revision ID: 002_create_application_tables
Revises: 001_enable_pgvector
"""

from alembic import op

from app.database import Base
from app import models  # noqa: F401 - registers all mapped tables on Base.metadata

revision = "002_create_application_tables"
down_revision = "001_enable_pgvector"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)