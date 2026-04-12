from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.project import Project, Sector, ReadinessLevel, ProjectStatus
from app.models.challenge import Challenge, ChallengeStatus
from app.models.match import Match, MatchStatus
from app.models.user import User, UserRole
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get platform overview analytics."""

    # Projects by sector
    projects_by_sector = (
        db.query(Project.sector, func.count(Project.id))
        .group_by(Project.sector)
        .all()
    )

    # Projects by readiness level
    projects_by_readiness = (
        db.query(Project.readiness_level, func.count(Project.id))
        .group_by(Project.readiness_level)
        .all()
    )

    # Projects by pipeline status
    projects_by_status = (
        db.query(Project.status, func.count(Project.id))
        .group_by(Project.status)
        .all()
    )

    # Challenge stats
    total_challenges = db.query(func.count(Challenge.id)).scalar() or 0
    open_challenges = db.query(func.count(Challenge.id)).filter(Challenge.status == ChallengeStatus.OPEN).scalar() or 0

    # Total users by role
    users_by_role = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )

    return {
        "total_projects": sum(count for _, count in projects_by_sector),
        "projects_by_sector": {sector.value: count for sector, count in projects_by_sector},
        "projects_by_readiness": {level.value: count for level, count in projects_by_readiness},
        "projects_by_status": {status.value: count for status, count in projects_by_status},
        "total_challenges": total_challenges,
        "open_challenges": open_challenges,
        "users_by_role": {role.value: count for role, count in users_by_role},
    }


@router.get("/matches")
def get_match_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get matching analytics."""

    total_matches = db.query(func.count(Match.id)).scalar() or 0

    matches_by_status = (
        db.query(Match.status, func.count(Match.id))
        .group_by(Match.status)
        .all()
    )

    avg_score = db.query(func.avg(Match.similarity_score)).scalar() or 0

    # Top matched projects
    top_projects = (
        db.query(
            Project.id,
            Project.title_en,
            Project.title_ar,
            func.count(Match.id).label("match_count"),
            func.avg(Match.similarity_score).label("avg_score"),
        )
        .join(Match, Match.project_id == Project.id)
        .group_by(Project.id, Project.title_en, Project.title_ar)
        .order_by(func.count(Match.id).desc())
        .limit(10)
        .all()
    )

    return {
        "total_matches": total_matches,
        "matches_by_status": {status.value: count for status, count in matches_by_status},
        "average_similarity_score": round(float(avg_score), 4),
        "top_matched_projects": [
            {
                "id": p.id,
                "title": p.title_en or p.title_ar,
                "match_count": p.match_count,
                "avg_score": round(float(p.avg_score), 4),
            }
            for p in top_projects
        ],
    }
