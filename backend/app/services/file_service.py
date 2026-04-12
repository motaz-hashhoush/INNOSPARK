import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile, HTTPException, status

from app.config import settings

ALLOWED_EXTENSIONS = {
    "pdf", "ppt", "pptx", "doc", "docx",
    "png", "jpg", "jpeg", "gif", "svg",
    "dwg", "dxf",  # CAD files
    "mp4", "webm", "avi",  # Video
    "zip", "rar",
}


def get_upload_dir() -> Path:
    """Get and ensure upload directory exists."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def validate_file(file: UploadFile) -> None:
    """Validate file extension and size."""
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '.{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )


async def save_upload_file(file: UploadFile, project_id: int) -> dict:
    """Save an uploaded file and return metadata."""
    validate_file(file)

    upload_dir = get_upload_dir() / str(project_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename to avoid collisions
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "bin"
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = upload_dir / unique_name

    # Read and save
    content = await file.read()
    file_size = len(content)

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB",
        )

    with open(file_path, "wb") as f:
        f.write(content)

    # Determine file type category
    file_type = _categorize_file(ext)

    return {
        "file_path": str(file_path),
        "file_name": file.filename or unique_name,
        "file_type": file_type,
        "file_size": file_size,
    }


def delete_file(file_path: str) -> None:
    """Delete a file from disk."""
    path = Path(file_path)
    if path.exists():
        path.unlink()


def _categorize_file(ext: str) -> str:
    """Categorize file by extension."""
    categories = {
        "pdf": "document",
        "doc": "document", "docx": "document",
        "ppt": "presentation", "pptx": "presentation",
        "png": "image", "jpg": "image", "jpeg": "image", "gif": "image", "svg": "image",
        "dwg": "cad", "dxf": "cad",
        "mp4": "video", "webm": "video", "avi": "video",
        "zip": "archive", "rar": "archive",
    }
    return categories.get(ext, "other")
