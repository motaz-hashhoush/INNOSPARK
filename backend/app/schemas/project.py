from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.project import Sector, ReadinessLevel, ProjectStatus


class TeamMember(BaseModel):
    name: str
    role: str = ""
    email: str = ""


class ProjectCreate(BaseModel):
    title_ar: Optional[str] = None
    title_en: Optional[str] = None
    summary_ar: Optional[str] = None
    summary_en: Optional[str] = None
    problem: str
    value_proposition: Optional[str] = None
    sector: Sector = Sector.OTHER
    team_members: List[TeamMember] = []
    supervisor_id: Optional[int] = None
    technical_outputs: Optional[str] = None
    development_needs: Optional[str] = None
    video_url: Optional[str] = None
    readiness_level: ReadinessLevel = ReadinessLevel.CONCEPT


class ProjectUpdate(BaseModel):
    title_ar: Optional[str] = None
    title_en: Optional[str] = None
    summary_ar: Optional[str] = None
    summary_en: Optional[str] = None
    problem: Optional[str] = None
    value_proposition: Optional[str] = None
    sector: Optional[Sector] = None
    team_members: Optional[List[TeamMember]] = None
    supervisor_id: Optional[int] = None
    technical_outputs: Optional[str] = None
    development_needs: Optional[str] = None
    video_url: Optional[str] = None
    readiness_level: Optional[ReadinessLevel] = None
    status: Optional[ProjectStatus] = None


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
    title_ar: Optional[str]
    title_en: Optional[str]
    summary_ar: Optional[str]
    summary_en: Optional[str]
    problem: str
    value_proposition: Optional[str]
    sector: Sector
    team_members: list
    supervisor_id: Optional[int]
    technical_outputs: Optional[str]
    development_needs: Optional[str]
    video_url: Optional[str]
    readiness_level: ReadinessLevel
    status: ProjectStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    files: List[ProjectFileResponse] = []

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
