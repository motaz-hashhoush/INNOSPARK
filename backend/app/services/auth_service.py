from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import verify_password, get_password_hash, create_access_token


def register_user(db: Session, user_data: UserCreate) -> User:
    """Register a new user."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        language_pref=user_data.language_pref,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate user and return user object."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return user


def create_user_token(user: User) -> dict:
    """Create JWT token for a user."""
    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}
