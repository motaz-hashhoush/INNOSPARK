import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Sector(str, enum.Enum):
    HEALTH = "health"
    ENVIRONMENT = "environment"
    ENERGY = "energy"
    AGRICULTURE = "agriculture"
    INDUSTRY = "industry"
    IT = "information_technology"
    EDUCATION = "education"
    OTHER = "other"


class ReadinessLevel(str, enum.Enum):
    CONCEPT = "concept"
    PROTOTYPE = "prototype"
    PILOT_READY = "pilot_ready"


class ProjectStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INCUBATION = "incubation"
    PARTNERSHIP = "partnership"
    MARKETED = "marketed"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    # Bilingual fields
    title_ar = Column(String(500), nullable=True)
    title_en = Column(String(500), nullable=True)
    summary_ar = Column(Text, nullable=True)
    summary_en = Column(Text, nullable=True)

    # Core details
    problem = Column(Text, nullable=False)
    value_proposition = Column(Text, nullable=True)
    sector = Column(Enum(Sector), nullable=False, default=Sector.OTHER)
    team_members = Column(JSON, default=list)  # [{name, role, email}]
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    technical_outputs = Column(Text, nullable=True)
    development_needs = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)

    # Classification
    readiness_level = Column(Enum(ReadinessLevel), default=ReadinessLevel.CONCEPT)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.SUBMITTED)

    # AI embedding (stored as JSON array of floats)
    embedding = Column(JSON, nullable=True)

    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    creator = relationship("User", foreign_keys=[created_by])
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")


class ProjectFile(Base):
    __tablename__ = "project_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)  # pdf, ppt, image, cad
    file_size = Column(Integer, nullable=True)  # bytes
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="files")
