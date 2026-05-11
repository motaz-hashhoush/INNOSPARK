from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectFile, ReadinessLevel, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse, ProjectFileResponse
from app.services.file_service import save_upload_file, delete_file
from app.services.ai_matching import embed_project, classify_readiness
from app.utils.deps import get_current_user, require_role

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new graduation project."""
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
        readiness_level=data.readiness_level,
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

    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=ProjectListResponse)
def list_projects(
    sector: Optional[str] = None,
    readiness: Optional[ReadinessLevel] = None,
    status_filter: Optional[ProjectStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """List projects with optional filters."""
    query = db.query(Project)

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


@router.get("/search", response_model=ProjectListResponse)
def semantic_search_projects(
    q: str,
    sector: Optional[str] = None,
    readiness: Optional[ReadinessLevel] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Semantic search using AI embeddings. Falls back to text search if model unavailable."""
    if not q or len(q.strip()) < 2:
        return list_projects(sector=sector, readiness=readiness, limit=limit, db=db)

    try:
        from app.services.ai_matching import generate_embedding, compute_similarity
        embedding = generate_embedding(q.strip())

        query = db.query(Project).filter(Project.embedding.isnot(None))
        if sector:
            query = query.filter(Project.sector.ilike(f"%{sector}%"))
        if readiness:
            query = query.filter(Project.readiness_level == readiness)

        projects = query.all()
        scored = sorted(
            [(p, compute_similarity(embedding, p.embedding)) for p in projects],
            key=lambda x: x[1], reverse=True,
        )
        top = [p for p, _ in scored[:limit]]
        return ProjectListResponse(projects=top, total=len(top))

    except Exception:
        return list_projects(search=q, sector=sector, readiness=readiness, limit=limit, db=db)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a single project detail (Virtual Booth view)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
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

    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/files", response_model=List[ProjectFileResponse], status_code=201)
async def upload_project_files(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload files for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.id != project.created_by and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    uploaded = []
    for file in files:
        file_meta = await save_upload_file(file, project_id)
        pf = ProjectFile(project_id=project_id, **file_meta)
        db.add(pf)
        uploaded.append(pf)

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
