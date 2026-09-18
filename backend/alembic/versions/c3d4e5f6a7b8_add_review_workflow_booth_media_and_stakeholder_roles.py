"""Add supervisor review workflow, booth media, bilingual titles and stakeholder roles

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-02 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NEW_USER_ROLES = ('PARK_MANAGER', 'VP_INNOVATION')
NEW_NOTIFICATION_TYPES = (
    'PROJECT_SUBMITTED', 'PROJECT_REVIEWED', 'PROJECT_EDITED',
    'PROJECT_SELECTED', 'CONTACT_REQUEST',
)


def upgrade() -> None:
    # Stakeholder roles notified when a company selects a project
    for value in NEW_USER_ROLES:
        op.execute(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{value}'")
    for value in NEW_NOTIFICATION_TYPES:
        op.execute(f"ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS '{value}'")

    # Bilingual titles (descriptions were added in b2c3d4e5f6a7)
    op.add_column('projects', sa.Column('title_en', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('title_ar', sa.Text(), nullable=True))

    # Virtual Booth media
    op.add_column('projects', sa.Column('image_url', sa.String(length=500), nullable=True))
    op.add_column('projects', sa.Column('video_url', sa.String(length=500), nullable=True))
    op.add_column('projects', sa.Column('demo_url', sa.String(length=500), nullable=True))

    # Supervisor review workflow
    approval_status = sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='approvalstatus')
    approval_status.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'projects',
        sa.Column('approval_status', approval_status, nullable=False, server_default='PENDING'),
    )
    op.add_column('projects', sa.Column('reviewed_by', sa.Integer(), nullable=True))
    op.add_column('projects', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('projects', sa.Column('review_note', sa.Text(), nullable=True))
    op.create_foreign_key(
        'fk_projects_reviewed_by_users', 'projects', 'users', ['reviewed_by'], ['id']
    )

    # Projects that already existed stay published — they predate the review step
    op.execute("UPDATE projects SET approval_status = 'APPROVED'")


def downgrade() -> None:
    op.drop_constraint('fk_projects_reviewed_by_users', 'projects', type_='foreignkey')
    op.drop_column('projects', 'review_note')
    op.drop_column('projects', 'reviewed_at')
    op.drop_column('projects', 'reviewed_by')
    op.drop_column('projects', 'approval_status')
    sa.Enum(name='approvalstatus').drop(op.get_bind(), checkfirst=True)

    op.drop_column('projects', 'demo_url')
    op.drop_column('projects', 'video_url')
    op.drop_column('projects', 'image_url')
    op.drop_column('projects', 'title_ar')
    op.drop_column('projects', 'title_en')
    # Enum values added to userrole / notificationtype are left in place:
    # PostgreSQL cannot drop a single value from an enum type.
