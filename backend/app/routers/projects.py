from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.models.project import Project, ProjectFile, ApprovalStatus, ReadinessLevel, ProjectStatus
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectFileResponse, ProjectMediaUpdate, ProjectReview,
)
from app.services.file_service import save_upload_file, delete_file, is_video_filename, public_file_url
from app.services.ai_matching import embed_project, classify_readiness
from app.services.notification_service import notify_stakeholders, notify_user
from app.services.translation_service import generate_bilingual_descriptions
from app.utils.deps import get_current_user, get_optional_user, require_role

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def _can_review(user: User, project: Project) -> bool:
    """Supervisors may sign off on their own projects; admins on anything."""
    return user.role == UserRole.ADMIN or (
        user.role == UserRole.SUPERVISOR and project.supervisor_id == user.id
    )


def _sees_unapproved(user: Optional[User]) -> bool:
    """Only staff can browse projects that have not been published yet."""
    return bool(user) and user.role in (
        UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EVALUATOR,
        UserRole.PARK_MANAGER, UserRole.VP_INNOVATION,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Ingest a graduation project. Admin only — projects come from the Najah
    Repository, so students/companies/supervisors do not submit them here."""
    project = Project(
        title=data.title,
        summary=data.summary,
        problem=data.problem,
        value_proposition=data.value_proposition,
        sector=data.sector,
        team_members=[m.model_dump() for m in data.team_members],
        supervisor_id=data.supervisor_id,
        technical_outputs=data.technical_outputs,
        development_needs=data.development_needs,
        attachment_url=data.attachment_url,
        dspace_uuid=data.dspace_uuid,
        collection=data.collection,
        image_url=data.image_url,
        readiness_level=data.readiness_level,
        approval_status=ApprovalStatus.PENDING,
        created_by=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Auto-classify readiness and generate embedding
    project.readiness_level = classify_readiness(project)
    try:
        embed_project(db, project)
    except Exception:
        pass  # AI model not available — skip embedding

    # The supervisor reviews and approves before the project is published
    notify_user(
        db,
        project.supervisor_id,
        f"New project '{project.title}' is awaiting your review and approval.",
        NotificationType.PROJECT_SUBMITTED,
    )
    db.commit()
    db.refresh(project)

    # Auto-generate Arabic + English titles and descriptions in the background
    background_tasks.add_task(generate_bilingual_descriptions, project.id)

    return project


@router.get("", response_model=ProjectListResponse)
def list_projects(
    sector: Optional[str] = None,
    readiness: Optional[ReadinessLevel] = None,
    status_filter: Optional[ProjectStatus] = None,
    approval: Optional[ApprovalStatus] = None,
    supervised: bool = False,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List projects with optional filters.

    Only approved projects are public. Staff can request a specific approval
    state, and supervisors can narrow the list to the projects they supervise.
    """
    query = db.query(Project)

    if supervised:
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        query = query.filter(Project.supervisor_id == current_user.id)

    if approval:
        if not _sees_unapproved(current_user):
            raise HTTPException(status_code=403, detail="Not authorized to filter by approval state")
        query = query.filter(Project.approval_status == approval)
    elif not _sees_unapproved(current_user):
        query = query.filter(Project.approval_status == ApprovalStatus.APPROVED)

    if sector:
        query = query.filter(Project.sector.ilike(f"%{sector}%"))
    if readiness:
        query = query.filter(Project.readiness_level == readiness)
    if status_filter:
        query = query.filter(Project.status == status_filter)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Project.title.ilike(search_term)) |
            (Project.summary.ilike(search_term))
        )

    total = query.count()
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    return ProjectListResponse(projects=projects, total=total)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get a single project detail (Virtual Booth view)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Unapproved projects are visible to staff and to the project's own people only
    if project.approval_status != ApprovalStatus.APPROVED and not _sees_unapproved(current_user):
        if not current_user or current_user.id != project.created_by:
            raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.put("/{project_id}/review", response_model=ProjectResponse)
def review_project(
    project_id: int,
    data: ProjectReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supervisor sign-off: approve a project for publication, or reject it."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not _can_review(project=project, user=current_user):
        raise HTTPException(
            status_code=403,
            detail="Only the assigned supervisor or an admin can review this project",
        )

    project.approval_status = ApprovalStatus.APPROVED if data.approved else ApprovalStatus.REJECTED
    project.reviewed_by = current_user.id
    project.reviewed_at = datetime.utcnow()
    project.review_note = data.note

    verdict = "approved and published" if data.approved else "rejected"
    notify_user(
        db,
        project.created_by,
        f"Your project '{project.title}' was {verdict} by {current_user.full_name}."
        + (f" Note: {data.note}" if data.note else ""),
        NotificationType.PROJECT_REVIEWED,
    )
    notify_stakeholders(
        db,
        f"{current_user.full_name} {verdict} the project '{project.title}'.",
        NotificationType.PROJECT_REVIEWED,
    )

    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}/media", response_model=ProjectResponse)
def update_project_media(
    project_id: int,
    data: ProjectMediaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Set the Virtual Booth video / demo / cover image. Admin only."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update project details."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only creator, supervisor, or admin can update
    if current_user.id not in (project.created_by, project.supervisor_id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "team_members" and value is not None:
            value = [m.model_dump() if hasattr(m, 'model_dump') else m for m in value]
        setattr(project, field, value)

    # Re-embed if text fields changed
    text_fields = {"title", "summary", "problem", "value_proposition", "technical_outputs"}
    if text_fields & set(update_data.keys()):
        try:
            embed_project(db, project)
        except Exception:
            pass

    # Stakeholders are alerted about supervisor edits (validation notes: admin
    # must be notified of any modification made by a supervisor).
    if current_user.role == UserRole.SUPERVISOR:
        notify_stakeholders(
            db,
            f"Supervisor {current_user.full_name} updated the project '{project.title}'.",
            NotificationType.PROJECT_EDITED,
        )

    # Source text changed: drop the stale LLM copy so the booth falls back to the
    # raw fields until the background regeneration lands (or if the LLM is down).
    regenerate = bool({"title", "summary", "problem"} & set(update_data.keys()))
    if regenerate:
        if "title" in update_data:
            project.title_en = project.title_ar = None
        if {"summary", "problem"} & set(update_data.keys()):
            project.description_en = project.description_ar = None

    db.commit()
    db.refresh(project)

    if regenerate:
        background_tasks.add_task(generate_bilingual_descriptions, project.id)

    return project


@router.post("/{project_id}/files", response_model=List[ProjectFileResponse], status_code=201)
async def upload_project_files(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload files for a project. Videos may only be uploaded by an admin."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.id != project.created_by and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.role != UserRole.ADMIN and any(is_video_filename(f.filename) for f in files):
        raise HTTPException(
            status_code=403,
            detail="Only an admin can upload Virtual Booth videos",
        )

    uploaded = []
    for file in files:
        file_meta = await save_upload_file(file, project_id)
        pf = ProjectFile(project_id=project_id, **file_meta)
        db.add(pf)
        uploaded.append(pf)
        # An uploaded video becomes the Virtual Booth video (admin-only, checked above)
        if pf.file_type == "video":
            project.video_url = public_file_url(project_id, file_meta["file_path"])

    db.commit()
    for pf in uploaded:
        db.refresh(pf)

    return uploaded


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Soft delete a project (admin only)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete associated files from disk
    for pf in project.files:
        delete_file(pf.file_path)

    db.delete(project)
    db.commit()
