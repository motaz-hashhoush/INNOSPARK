import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://innospark:innospark_pass@localhost:5432/innospark_db"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # File Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 200  # booth videos

    # AI
    AI_MODEL_NAME: str = "all-MiniLM-L6-v2"
    AI_MAX_SEQ_LENGTH: int = 1024

    # Matching
    MATCH_MIN_SCORE: float = 0.35  # minimum composite score for a match to be suggested
    MATCH_CANDIDATE_POOL: int = 15  # candidates sent to the LLM reranker

    # Self-hosted LLM (Qwen) — used for reranking and translation
    LLM_BASE_URL: str = "http://93.127.132.59:8080/v1"
    LLM_API_KEY: str = "not-needed"
    LLM_MODEL: str = "Qwen/Qwen3-14B-AWQ"
    LLM_TIMEOUT: int = 30
    LLM_RERANK_ENABLED: bool = True

    # InnoPark / An-Najah policy
    INNOPARK_CONTACT_EMAIL: str = "innopark@najah.edu"
    STUDENT_EMAIL_DOMAIN: str = "najah.edu"
    ENFORCE_STUDENT_EMAIL_DOMAIN: bool = True

    # Outgoing email (contact requests to the park manager). Empty host = log only.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_FROM: str = "innospark@najah.edu"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
