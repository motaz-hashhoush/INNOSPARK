"""
Guest Session Router
====================
Allows unauthenticated users to submit a challenge description and receive
AI-powered project match results. A browser-generated UUID is used as
the session token so users can revisit their results within the same session.

No account required — challenges created here are marked is_guest=True
and are NOT listed in the public challenge feed.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.challenge import Challenge, ChallengeStatus
from app.models.project import Project
from app.models.match import Match, MatchStatus
from app.schemas.challenge import GuestChallengeCreate, ChallengeResponse
from app.schemas.match import MatchResponse
from app.services.ai_matching import embed_challenge, run_matching

router = APIRouter(prefix="/api/guest", tags=["Guest Session"])


# ── Response Schemas ─────────────────────────────────────────────────────────

class GuestMatchResult(BaseModel):
    challenge: ChallengeResponse
    matches: List[MatchResponse]
    total: int


class GuestSessionResponse(BaseModel):
    challenge: ChallengeResponse
    matches: List[MatchResponse]
    total: int


# ── Endpoints ─────────────────────────────────────────────────────────────────
from datetime import datetime
from app.services.ai_matching import generate_embedding, compute_similarity

@router.post("/match", response_model=GuestSessionResponse)
def guest_match(
    data: GuestChallengeCreate,
    top_k: int = 10,
    db: Session = Depends(get_db),
):
    """
    Submit a challenge description as a guest and receive AI match results
    immediately. Does NOT save to the database.
    """
    # 1. Build text for embedding
    parts = [data.title, data.description]
    if data.priorities:
        parts.append(data.priorities)
    if data.expected_outputs:
        parts.append(data.expected_outputs)
    text = " ".join(parts)

    # 2. Generate embedding
    try:
        embedding = generate_embedding(text)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI model unavailable: {str(e)}. Please try again later."
        )

    # 3. Fetch projects and compute similarities in memory
    projects = db.query(Project).filter(Project.embedding.isnot(None)).all()
    
    scored = []
    for project in projects:
        score = compute_similarity(embedding, project.embedding)
        scored.append((project, score))

    # Sort by score descending, take top_k
    scored.sort(key=lambda x: x[1], reverse=True)
    scored = scored[:top_k]

    # 4. Construct mock response objects (not saved to DB)
    match_results = []
    for i, (project, score) in enumerate(scored):
        match_results.append(MatchResponse(
            id=i + 1,  # Mock ID
            project_id=project.id,
            challenge_id=0,  # Mock ID
            similarity_score=round(score, 4),
            status=MatchStatus.SUGGESTED,
            created_at=datetime.utcnow(),
            project_title=project.title,
            project_sector=project.sector,
            challenge_title=data.title,
        ))

    challenge_resp = ChallengeResponse(
        id=0,  # Mock ID
        company_id=0,
        title=data.title,
        description=data.description,
        sector=data.sector,
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
