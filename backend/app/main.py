import os
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.models import *  # noqa: F401 — import all models for table creation

from app.routers import auth, projects, challenges, matching, analytics, pipeline, notifications

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="INNOSPARK API",
    description="Platform for showcasing university graduation projects and AI-powered matching with industry challenges",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(challenges.router)
app.include_router(matching.router)
app.include_router(analytics.router)
app.include_router(pipeline.router)
app.include_router(notifications.router)


@app.on_event("startup")
def startup_event():
    """Create database tables and upload directory on startup."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")

    # Ensure upload directory exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Mount static files for uploads
    if upload_dir.exists():
        app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")
        logger.info(f"Upload directory mounted: {upload_dir}")


@app.get("/", tags=["Health"])
def root():
    return {
        "name": "INNOSPARK API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
