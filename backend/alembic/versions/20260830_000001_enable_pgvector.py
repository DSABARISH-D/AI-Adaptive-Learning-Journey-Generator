"""enable pgvector

Revision ID: 001_enable_pgvector
Revises: 
Create Date: 2026-08-30 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = '001_enable_pgvector'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')


def downgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.execute('DROP EXTENSION IF EXISTS vector')
