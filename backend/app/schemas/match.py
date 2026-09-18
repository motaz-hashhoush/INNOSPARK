from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.match import MatchStatus


class MatchResponse(BaseModel):
    id: int
    project_id: int
    challenge_id: int
    similarity_score: float
    match_reason: Optional[str] = None
    status: MatchStatus
    created_at: datetime

    # Nested info
    project_title: Optional[str] = None
    project_sector: Optional[str] = None
    challenge_title: Optional[str] = None

    class Config:
        from_attributes = True


class MatchListResponse(BaseModel):
    matches: List[MatchResponse]
    total: int


class MatchStatusUpdate(BaseModel):
    status: MatchStatus


class ContactRequest(BaseModel):
    """A company asking the InnoPark manager to broker contact with a team."""
    message: Optional[str] = None
