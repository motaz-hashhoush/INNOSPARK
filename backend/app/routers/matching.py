from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.models.match import Match, MatchStatus
from app.schemas.match import ContactRequest, MatchResponse, MatchListResponse, MatchStatusUpdate
from app.services.ai_matching import run_matching
from app.services.email_service import send_email
from app.services.notification_service import notify_stakeholders, notify_users
from app.utils.deps import get_current_user, require_role, get_optional_user

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
            match_reason=m.reason,
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
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get existing match results for a challenge."""
    from app.models.challenge import Challenge
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Check visibility
    if not challenge.is_public:
        if not current_user or (current_user.id != challenge.company_id and current_user.role != UserRole.ADMIN):
            raise HTTPException(status_code=403, detail="This challenge is not public")

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
            match_reason=m.reason,
            status=m.status,
            created_at=m.created_at,
            project_title=m.project.title if m.project else None,
            project_sector=m.project.sector if m.project else None,
            challenge_title=m.challenge.title if m.challenge else None,
        ))

    return MatchListResponse(matches=result, total=len(result))


@router.post("/{match_id}/contact")
def contact_park_manager(
    match_id: int,
    data: ContactRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
):
    """Ask the InnoPark manager to put the company in touch with a project team.

    Companies never contact students directly — the park manager brokers it.
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    project_title = match.project.title if match.project else f"#{match.project_id}"
    challenge_title = match.challenge.title if match.challenge else f"#{match.challenge_id}"

    message = (
        f"{current_user.full_name} ({current_user.email}) requested contact about the project "
        f"'{project_title}' matched to the challenge '{challenge_title}'."
    )
    if data.message:
        message += f" Message: {data.message}"

    notify_stakeholders(db, message, NotificationType.CONTACT_REQUEST)
    db.commit()

    # Email innopark@najah.edu too; Reply-To lets the manager answer the company directly.
    background_tasks.add_task(
        send_email,
        settings.INNOPARK_CONTACT_EMAIL,
        f"[InnoSpark] Contact request: {project_title}",
        message,
        reply_to=current_user.email,
    )

    return {
        "message": "Your request was sent to the InnoPark manager.",
        "contact_email": settings.INNOPARK_CONTACT_EMAIL,
    }


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

    # Selecting a project must alert the admin, the park manager and the VP for
    # innovation & AI, plus the project's own team.
    if data.status == MatchStatus.ACCEPTED:
        project_title = match.project.title if match.project else f"#{match.project_id}"
        challenge_title = match.challenge.title if match.challenge else f"#{match.challenge_id}"
        notify_stakeholders(
            db,
            f"{current_user.full_name} selected the project '{project_title}' "
            f"for the challenge '{challenge_title}'.",
            NotificationType.PROJECT_SELECTED,
        )
        if match.project:
            notify_users(
                db,
                [match.project.created_by, match.project.supervisor_id],
                f"Your project '{project_title}' was selected for the challenge '{challenge_title}'.",
                NotificationType.PROJECT_SELECTED,
            )

    db.commit()
    db.refresh(match)

    return MatchResponse(
        id=match.id,
        project_id=match.project_id,
        challenge_id=match.challenge_id,
        similarity_score=match.similarity_score,
        match_reason=match.reason,
        status=match.status,
        created_at=match.created_at,
        project_title=match.project.title if match.project else None,
        project_sector=match.project.sector if match.project else None,
        challenge_title=match.challenge.title if match.challenge else None,
    )
