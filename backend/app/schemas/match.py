from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.match import MatchStatus


class MatchResponse(BaseModel):
    id: int
    project_id: int
    challenge_id: int
    similarity_score: float
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
