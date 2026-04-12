import enum
from datetime import datetime

from sqlalchemy import Column, Integer, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MatchStatus(str, enum.Enum):
    SUGGESTED = "suggested"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    status = Column(Enum(MatchStatus), default=MatchStatus.SUGGESTED)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    challenge = relationship("Challenge")
