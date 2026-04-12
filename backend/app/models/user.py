import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, DateTime
from app.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    SUPERVISOR = "supervisor"
    COMPANY = "company"
    EVALUATOR = "evaluator"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    language_pref = Column(String(5), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
