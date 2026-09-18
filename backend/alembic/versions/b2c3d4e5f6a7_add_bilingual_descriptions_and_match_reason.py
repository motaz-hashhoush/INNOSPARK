"""Add bilingual project descriptions and match reason

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bilingual project descriptions (auto-translated via LLM)
    op.add_column('projects', sa.Column('description_en', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('description_ar', sa.Text(), nullable=True))
    # LLM explanation for suggested matches
    op.add_column('matches', sa.Column('reason', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('matches', 'reason')
    op.drop_column('projects', 'description_ar')
    op.drop_column('projects', 'description_en')
