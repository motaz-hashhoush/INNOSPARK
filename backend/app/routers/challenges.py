from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.challenge import Challenge, ChallengeStatus
from app.models.project import Sector
from app.schemas.challenge import ChallengeCreate, ChallengeUpdate, ChallengeResponse, ChallengeListResponse
from app.services.ai_matching import embed_challenge
from app.utils.deps import get_current_user, require_role

router = APIRouter(prefix="/api/challenges", tags=["Challenges"])


@router.post("", response_model=ChallengeResponse, status_code=201)
def create_challenge(
    data: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
):
    """Create a new industry challenge (company or admin only)."""
    challenge = Challenge(
        company_id=current_user.id,
        title=data.title,
        description=data.description,
        sector=data.sector,
        priorities=data.priorities,
        expected_outputs=data.expected_outputs,
        budget=data.budget,
        is_public=data.is_public,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    # Generate embedding
    try:
        embed_challenge(db, challenge)
    except Exception:
        pass

    return challenge


@router.get("", response_model=ChallengeListResponse)
def list_challenges(
    sector: Optional[Sector] = None,
    status_filter: Optional[ChallengeStatus] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List challenges. Non-company users only see public challenges."""
    query = db.query(Challenge)

    # Non-admin, non-company users only see public challenges
    if current_user.role not in (UserRole.COMPANY, UserRole.ADMIN):
        query = query.filter(Challenge.is_public == True)

    if sector:
        query = query.filter(Challenge.sector == sector)
    if status_filter:
        query = query.filter(Challenge.status == status_filter)

    total = query.count()
    challenges = query.order_by(Challenge.created_at.desc()).offset(skip).limit(limit).all()

    return ChallengeListResponse(challenges=challenges, total=total)


@router.get("/{challenge_id}", response_model=ChallengeResponse)
def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get challenge detail."""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Check visibility
    if not challenge.is_public and current_user.id != challenge.company_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="This challenge is not public")

    return challenge


@router.put("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge(
    challenge_id: int,
    data: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a challenge."""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if current_user.id != challenge.company_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(challenge, field, value)

    # Re-embed if text changed
    text_fields = {"title", "description", "priorities", "expected_outputs"}
    if text_fields & set(update_data.keys()):
        try:
            embed_challenge(db, challenge)
        except Exception:
            pass

    db.commit()
    db.refresh(challenge)
    return challenge
