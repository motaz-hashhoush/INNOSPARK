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


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.SYSTEM)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
