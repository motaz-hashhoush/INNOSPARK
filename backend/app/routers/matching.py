from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchResponse, MatchListResponse, MatchStatusUpdate
from app.services.ai_matching import run_matching
from app.utils.deps import get_current_user, require_role

router = APIRouter(prefix="/api/matching", tags=["AI Matching"])


@router.post("/run/{challenge_id}", response_model=MatchListResponse)
def run_ai_matching(
    challenge_id: int,
    top_k: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN, UserRole.EVALUATOR)),
):
    """Run AI matching to find top projects for a challenge."""
    matches = run_matching(db, challenge_id, top_k=top_k)

    result = []
    for m in matches:
        result.append(MatchResponse(
            id=m.id,
            project_id=m.project_id,
            challenge_id=m.challenge_id,
            similarity_score=m.similarity_score,
            status=m.status,
            created_at=m.created_at,
            project_title=m.project.title if m.project else None,
            project_sector=m.project.sector if m.project else None,
            challenge_title=m.challenge.title if m.challenge else None,
        ))

    return MatchListResponse(matches=result, total=len(result))


@router.get("/results/{challenge_id}", response_model=MatchListResponse)
def get_match_results(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get existing match results for a challenge."""
    matches = (
        db.query(Match)
        .filter(Match.challenge_id == challenge_id)
        .order_by(Match.similarity_score.desc())
        .all()
    )

    result = []
    for m in matches:
        result.append(MatchResponse(
            id=m.id,
            project_id=m.project_id,
            challenge_id=m.challenge_id,
            similarity_score=m.similarity_score,
            status=m.status,
            created_at=m.created_at,
            project_title=m.project.title if m.project else None,
            project_sector=m.project.sector if m.project else None,
            challenge_title=m.challenge.title if m.challenge else None,
        ))

    return MatchListResponse(matches=result, total=len(result))


@router.put("/{match_id}/status", response_model=MatchResponse)
def update_match_status(
    match_id: int,
    data: MatchStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN, UserRole.EVALUATOR)),
):
    """Accept or reject a match suggestion."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.status = data.status
    db.commit()
    db.refresh(match)

    return MatchResponse(
        id=match.id,
        project_id=match.project_id,
        challenge_id=match.challenge_id,
        similarity_score=match.similarity_score,
        status=match.status,
        created_at=match.created_at,
        project_title=match.project.title if match.project else None,
        project_sector=match.project.sector if match.project else None,
        challenge_title=match.challenge.title if match.challenge else None,
    )
