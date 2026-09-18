from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import register_user, authenticate_user, create_user_token
from app.utils.deps import get_current_user, require_role
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = register_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT access token."""
    user = authenticate_user(db, user_data.email, user_data.password)
    return create_user_token(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """List accounts, optionally by role (admin only — used to assign supervisors)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.full_name).all()
