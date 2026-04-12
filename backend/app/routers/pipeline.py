from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.notification import Notification, NotificationType
from app.utils.deps import get_current_user, require_role

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline Management"])

# Pipeline stages in order
PIPELINE_STAGES = [
    ProjectStatus.SUBMITTED,
    ProjectStatus.UNDER_REVIEW,
    ProjectStatus.INCUBATION,
    ProjectStatus.PARTNERSHIP,
    ProjectStatus.MARKETED,
]


@router.get("/stages")
def get_pipeline_stages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all pipeline stages with project counts and project lists."""
    stages = []
    for stage in PIPELINE_STAGES:
        projects = db.query(Project).filter(Project.status == stage).all()
        stages.append({
            "stage": stage.value,
            "count": len(projects),
            "projects": [
                {
                    "id": p.id,
                    "title": p.title_en or p.title_ar,
                    "sector": p.sector.value,
                    "readiness": p.readiness_level.value,
                }
                for p in projects
            ],
        })
    return {"stages": stages}


@router.put("/{project_id}/advance")
def advance_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.EVALUATOR)),
):
    """Advance a project to the next pipeline stage."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    current_index = PIPELINE_STAGES.index(project.status)
    if current_index >= len(PIPELINE_STAGES) - 1:
        raise HTTPException(status_code=400, detail="Project is already at the final stage")

    old_status = project.status
    project.status = PIPELINE_STAGES[current_index + 1]
    
    # Notify creator
    notification = Notification(
        user_id=project.created_by,
        message=f"Your project '{project.title_en or project.title_ar}' has advanced from {old_status.value} to {project.status.value}",
        type=NotificationType.STATUS_CHANGE,
    )
    db.add(notification)
    db.commit()
    db.refresh(project)

    return {
        "project_id": project.id,
        "title": project.title_en or project.title_ar,
        "previous_status": old_status.value,
        "new_status": project.status.value,
    }


@router.put("/{project_id}/set-stage")
def set_project_stage(
    project_id: int,
    stage: ProjectStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Set a project to a specific pipeline stage (admin only)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    old_status = project.status
    project.status = stage

    notification = Notification(
        user_id=project.created_by,
        message=f"Your project '{project.title_en or project.title_ar}' status changed from {old_status.value} to {stage.value}",
        type=NotificationType.STATUS_CHANGE,
    )
    db.add(notification)
    db.commit()
    db.refresh(project)

    return {
        "project_id": project.id,
        "previous_status": old_status.value,
        "new_status": project.status.value,
    }
