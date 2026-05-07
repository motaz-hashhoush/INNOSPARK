"""Add guest session fields to challenges

Revision ID: a1b2c3d4e5f6
Revises: 17137f006b3a
Create Date: 2026-05-06 23:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '17137f006b3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make company_id nullable for guest challenges
    op.alter_column('challenges', 'company_id', nullable=True)
    # Add session_token column for guest sessions
    op.add_column('challenges', sa.Column('session_token', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_challenges_session_token'), 'challenges', ['session_token'], unique=False)
    # Add is_guest flag
    op.add_column('challenges', sa.Column('is_guest', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('challenges', 'is_guest')
    op.drop_index(op.f('ix_challenges_session_token'), table_name='challenges')
    op.drop_column('challenges', 'session_token')
    op.alter_column('challenges', 'company_id', nullable=False)
