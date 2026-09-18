"""
Guest Session Router
====================
Allows unauthenticated users to submit a challenge description and receive
AI-powered project match results. A browser-generated UUID is used as
the session token so users can revisit their results within the same session.

No account required — challenges created here are marked is_guest=True
and are NOT listed in the public challenge feed.
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.challenge import ChallengeStatus
from app.models.match import MatchStatus
from app.schemas.challenge import GuestChallengeCreate, ChallengeResponse
from app.schemas.match import MatchResponse
from app.services.ai_matching import find_matches

router = APIRouter(prefix="/api/guest", tags=["Guest Session"])


# ── Response Schemas ─────────────────────────────────────────────────────────

class GuestSessionResponse(BaseModel):
    challenge: ChallengeResponse
    matches: List[MatchResponse]
    total: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/match", response_model=GuestSessionResponse)
def guest_match(
    data: GuestChallengeCreate,
    top_k: int = 10,
    db: Session = Depends(get_db),
):
    """
    Submit a challenge description as a guest and receive smart match results
    immediately. Does NOT save to the database.

    Matching pipeline: hybrid structured scoring (sector, keywords, readiness,
    embeddings) with a relevance threshold, then LLM reranking. An empty
    `matches` list means no relevant projects were found.
    """
    try:
        ranked = find_matches(
            db,
            title=data.title,
            description=data.description,
            sector=data.sector,
            priorities=data.priorities,
            expected_outputs=data.expected_outputs,
            top_k=top_k,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI matching is temporarily unavailable: {str(e)}. Please try again later."
        )

    # Construct mock response objects (not saved to DB)
    match_results = []
    for i, (project, score, reason) in enumerate(ranked):
        match_results.append(MatchResponse(
            id=i + 1,  # Mock ID
            project_id=project.id,
            challenge_id=0,  # Mock ID
            similarity_score=round(score, 4),
            match_reason=reason,
            status=MatchStatus.SUGGESTED,
            created_at=datetime.utcnow(),
            project_title=project.title,
            project_sector=project.sector,
            project_booth_published=project.booth_published,
            challenge_title=data.title,
        ))

    challenge_resp = ChallengeResponse(
        id=0,  # Mock ID
        company_id=0,
        title=data.title,
        description=data.description or "",
        sector=data.sector or "other",
        priorities=data.priorities,
        expected_outputs=data.expected_outputs,
        budget=None,
        is_public=False,
        status=ChallengeStatus.OPEN,
        session_token=data.session_token,
        is_guest=True,
        created_at=datetime.utcnow(),
    )

    return GuestSessionResponse(
        challenge=challenge_resp,
        matches=match_results,
        total=len(match_results),
    )
