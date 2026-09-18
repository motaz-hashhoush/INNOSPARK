"""
Notification Service
====================
Small helpers for creating in-app notifications. Callers are responsible for
committing — these only add rows to the session so a notification never lands
without the change that triggered it.
"""
from typing import Iterable, List, Optional, Sequence

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.user import STAKEHOLDER_ROLES, User, UserRole


def notify_user(
    db: Session,
    user_id: Optional[int],
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
) -> Optional[Notification]:
    """Queue a notification for a single user. No-op when user_id is None."""
    if not user_id:
        return None
    notification = Notification(user_id=user_id, message=message, type=type)
    db.add(notification)
    return notification


def notify_users(
    db: Session,
    user_ids: Iterable[Optional[int]],
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
) -> List[Notification]:
    """Queue the same notification for several users, skipping blanks/duplicates."""
    seen = set()
    created = []
    for user_id in user_ids:
        if not user_id or user_id in seen:
            continue
        seen.add(user_id)
        notification = notify_user(db, user_id, message, type)
        if notification:
            created.append(notification)
    return created


def notify_roles(
    db: Session,
    roles: Sequence[UserRole],
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
) -> List[Notification]:
    """Queue a notification for every user holding one of the given roles."""
    user_ids = [u.id for u in db.query(User.id).filter(User.role.in_(roles)).all()]
    return notify_users(db, user_ids, message, type)


def notify_stakeholders(
    db: Session,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
) -> List[Notification]:
    """Alert the admin, the park manager and the VP for innovation & AI."""
    return notify_roles(db, STAKEHOLDER_ROLES, message, type)
