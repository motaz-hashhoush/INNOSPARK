from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.project import Sector, ReadinessLevel, ProjectStatus, ApprovalStatus


class TeamMember(BaseModel):
    name: str
    role: str = ""
    email: str = ""


class ProjectCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    problem: str
    value_proposition: Optional[str] = None
    sector: Optional[str] = "other"
    team_members: List[TeamMember] = []
    supervisor_id: Optional[int] = None
    technical_outputs: Optional[str] = None
    development_needs: Optional[str] = None
    attachment_url: Optional[str] = None
    dspace_uuid: Optional[str] = None
    collection: Optional[str] = None
    image_url: Optional[str] = None
    readiness_level: ReadinessLevel = ReadinessLevel.CONCEPT


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    problem: Optional[str] = None
    value_proposition: Optional[str] = None
    sector: Optional[str] = None
    team_members: Optional[List[TeamMember]] = None
    supervisor_id: Optional[int] = None
    technical_outputs: Optional[str] = None
    development_needs: Optional[str] = None
    attachment_url: Optional[str] = None
    dspace_uuid: Optional[str] = None
    collection: Optional[str] = None
    image_url: Optional[str] = None
    readiness_level: Optional[ReadinessLevel] = None
    status: Optional[ProjectStatus] = None


class ProjectReview(BaseModel):
    """Supervisor decision on a submitted project."""
    approved: bool
    note: Optional[str] = None


class ProjectMediaUpdate(BaseModel):
    """Virtual Booth media — admin only."""
    video_url: Optional[str] = None
    demo_url: Optional[str] = None
    image_url: Optional[str] = None


class ProjectFileResponse(BaseModel):
    id: int
    file_name: str
    file_type: Optional[str]
    file_size: Optional[int]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: int
    title: str
    title_en: Optional[str] = None
    title_ar: Optional[str] = None
    summary: Optional[str]
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    problem: str
    value_proposition: Optional[str]
    sector: Optional[str]
    team_members: list
    supervisor_id: Optional[int]
    technical_outputs: Optional[str]
    development_needs: Optional[str]
    attachment_url: Optional[str]
    dspace_uuid: Optional[str]
    collection: Optional[str]
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    demo_url: Optional[str] = None
    readiness_level: ReadinessLevel
    status: ProjectStatus
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_note: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    files: List[ProjectFileResponse] = []

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
