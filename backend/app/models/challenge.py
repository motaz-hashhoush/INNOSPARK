import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.project import Sector


class ChallengeStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    CLOSED = "closed"


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Details
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    sector = Column(Enum(Sector), nullable=False)
    priorities = Column(Text, nullable=True)
    expected_outputs = Column(Text, nullable=True)
    budget = Column(Float, nullable=True)
    is_public = Column(Boolean, default=True)
    status = Column(Enum(ChallengeStatus), default=ChallengeStatus.OPEN)

    # AI embedding
    embedding = Column(JSON, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("User", foreign_keys=[company_id])
