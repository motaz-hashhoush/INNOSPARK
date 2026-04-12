from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    language_pref: str = "en"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    language_pref: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
