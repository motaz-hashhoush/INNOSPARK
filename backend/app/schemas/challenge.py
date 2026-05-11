from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.project import Sector
from app.models.challenge import ChallengeStatus


class ChallengeCreate(BaseModel):
    title: str
    description: str
    sector: Sector
    priorities: Optional[str] = None
    expected_outputs: Optional[str] = None
    budget: Optional[float] = None
    is_public: bool = True


class GuestChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sector: Optional[Sector] = None
    priorities: Optional[str] = None
    expected_outputs: Optional[str] = None
    session_token: str  # browser-generated UUID


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[Sector] = None
    priorities: Optional[str] = None
    expected_outputs: Optional[str] = None
    budget: Optional[float] = None
    is_public: Optional[bool] = None
    status: Optional[ChallengeStatus] = None


class ChallengeResponse(BaseModel):
    id: int
    company_id: int
    title: str
    description: str
    sector: Sector
    priorities: Optional[str]
    expected_outputs: Optional[str]
    budget: Optional[float]
    is_public: bool
    status: ChallengeStatus
    session_token: Optional[str] = None
    is_guest: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengeListResponse(BaseModel):
    challenges: List[ChallengeResponse]
    total: int
