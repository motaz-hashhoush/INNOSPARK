"""
Translation Service
===================
Generates bilingual (Arabic + English) titles and descriptions for projects
using the self-hosted LLM. Designed to run as a FastAPI background task after
project creation/update so ingestion is never blocked by the LLM.
"""
import logging

from app.database import SessionLocal
from app.models.project import Project
from app.services.llm_service import detect_language, translate_text

logger = logging.getLogger(__name__)


def _fill_bilingual(project: Project, field: str, source: str) -> None:
    """
    Store `source` in the `<field>_<lang>` column matching its detected language
    and fill the other side with an LLM translation. Best-effort: a failed
    translation leaves the missing side as None.
    """
    source_lang = detect_language(source)
    target_lang = "en" if source_lang == "ar" else "ar"

    setattr(project, f"{field}_{source_lang}", source)

    translated = translate_text(source, target_lang)
    if translated:
        setattr(project, f"{field}_{target_lang}", translated)
    else:
        logger.warning(
            f"Translation of {field} to '{target_lang}' failed for project {project.id}"
        )


def generate_bilingual_descriptions(project_id: int) -> None:
    """
    Build title_en/title_ar and description_en/description_ar for a project.

    Titles come from the project title; descriptions from summary + problem.

    Opens its own DB session — safe to run as a background task after the
    request's session is closed.
    """
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return

        if project.title and project.title.strip():
            _fill_bilingual(project, "title", project.title.strip())

        description = " ".join(filter(None, [project.summary, project.problem])).strip()
        if description:
            _fill_bilingual(project, "description", description)

        db.commit()
    except Exception as e:
        logger.error(f"Bilingual generation failed for project {project_id}: {e}")
        db.rollback()
    finally:
        db.close()
