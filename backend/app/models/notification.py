import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, Boolean
from app.database import Base


class NotificationType(str, enum.Enum):
    MATCH_FOUND = "match_found"
    STATUS_CHANGE = "status_change"
    NEW_CHALLENGE = "new_challenge"
    COMPANY_REQUEST = "company_request"
    SYSTEM = "system"
    # Review workflow + stakeholder alerts
    PROJECT_SUBMITTED = "project_submitted"   # supervisor: a project needs review
    PROJECT_REVIEWED = "project_reviewed"     # creator/admin: approved or rejected
    PROJECT_EDITED = "project_edited"         # admin: a supervisor edited a project
    PROJECT_SELECTED = "project_selected"     # admin/park manager/VP: company picked a project
    CONTACT_REQUEST = "contact_request"       # admin/park manager: company asked to be put in touch
    PROJECT_PUBLISHED = "project_published"   # creator/supervisor/stakeholders: project went live in the Virtual Booth


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.SYSTEM)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
