"""Add Virtual Booth publishing flag

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'PROJECT_PUBLISHED'")

    # The Virtual Booth is a curated subset of the project database: same row, one flag.
    # No backfill — nothing is in the booth until a supervisor/admin publishes it.
    op.add_column(
        'projects',
        sa.Column('booth_published', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column('projects', sa.Column('booth_published_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'booth_published_at')
    op.drop_column('projects', 'booth_published')
    # PROJECT_PUBLISHED stays in notificationtype: PostgreSQL cannot drop a single enum value.
