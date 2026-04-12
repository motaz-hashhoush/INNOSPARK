import logging
from typing import List, Optional

import numpy as np
from sqlalchemy.orm import Session

from app.models.project import Project, ReadinessLevel
from app.models.challenge import Challenge
from app.models.match import Match, MatchStatus
from app.models.notification import Notification, NotificationType

logger = logging.getLogger(__name__)

# Lazy-loaded model instance
_model = None


def _get_model():
    """Lazy-load the sentence-transformers model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            from app.config import settings
            logger.info(f"Loading AI model: {settings.AI_MODEL_NAME}")
            _model = SentenceTransformer(settings.AI_MODEL_NAME)
            logger.info("AI model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load AI model: {e}")
            raise
    return _model


def generate_embedding(text: str) -> List[float]:
    """Generate embedding vector for a text string."""
    model = _get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def compute_similarity(embedding_a: List[float], embedding_b: List[float]) -> float:
    """Compute cosine similarity between two embedding vectors."""
    a = np.array(embedding_a)
    b = np.array(embedding_b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def build_project_text(project: Project) -> str:
    """Build a combined text representation of a project for embedding."""
    parts = []
    if project.title_en:
        parts.append(project.title_en)
    if project.title_ar:
        parts.append(project.title_ar)
    if project.summary_en:
        parts.append(project.summary_en)
    if project.summary_ar:
        parts.append(project.summary_ar)
    if project.problem:
        parts.append(project.problem)
    if project.value_proposition:
        parts.append(project.value_proposition)
    if project.technical_outputs:
        parts.append(project.technical_outputs)
    return " ".join(parts)


def build_challenge_text(challenge: Challenge) -> str:
    """Build a combined text representation of a challenge for embedding."""
    parts = [challenge.title, challenge.description]
    if challenge.priorities:
        parts.append(challenge.priorities)
    if challenge.expected_outputs:
        parts.append(challenge.expected_outputs)
    return " ".join(parts)


def embed_project(db: Session, project: Project) -> Project:
    """Generate and store embedding for a project."""
    text = build_project_text(project)
    if text.strip():
        project.embedding = generate_embedding(text)
        db.commit()
        db.refresh(project)
    return project


def embed_challenge(db: Session, challenge: Challenge) -> Challenge:
    """Generate and store embedding for a challenge."""
    text = build_challenge_text(challenge)
    if text.strip():
        challenge.embedding = generate_embedding(text)
        db.commit()
        db.refresh(challenge)
    return challenge


def classify_readiness(project: Project) -> ReadinessLevel:
    """Classify project readiness based on keywords in description."""
    text = build_project_text(project).lower()

    pilot_keywords = ["pilot", "deployment", "field test", "production", "launched", "market ready",
                       "تجريبي", "نشر", "إطلاق", "جاهز للسوق"]
    prototype_keywords = ["prototype", "working model", "demo", "mvp", "tested",
                          "نموذج أولي", "نسخة تجريبية", "عرض"]

    for kw in pilot_keywords:
        if kw in text:
            return ReadinessLevel.PILOT_READY

    for kw in prototype_keywords:
        if kw in text:
            return ReadinessLevel.PROTOTYPE

    return ReadinessLevel.CONCEPT


def run_matching(db: Session, challenge_id: int, top_k: int = 10) -> List[Match]:
    """Run AI matching: find top-k projects most similar to a challenge."""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        return []

    # Ensure challenge has embedding
    if not challenge.embedding:
        embed_challenge(db, challenge)
        if not challenge.embedding:
            return []

    # Get all projects with embeddings
    projects = db.query(Project).filter(Project.embedding.isnot(None)).all()

    # Compute similarities
    scored = []
    for project in projects:
        score = compute_similarity(challenge.embedding, project.embedding)
        scored.append((project, score))

    # Sort by score descending, take top_k
    scored.sort(key=lambda x: x[1], reverse=True)
    scored = scored[:top_k]

    # Create or update match records
    matches = []
    for project, score in scored:
        existing = db.query(Match).filter(
            Match.project_id == project.id,
            Match.challenge_id == challenge_id,
        ).first()

        if existing:
            existing.similarity_score = score
            match = existing
        else:
            match = Match(
                project_id=project.id,
                challenge_id=challenge_id,
                similarity_score=round(score, 4),
                status=MatchStatus.SUGGESTED,
            )
            db.add(match)

        matches.append(match)

        # Create notification for project creator
        notification = Notification(
            user_id=project.created_by,
            message=f"Your project '{project.title_en or project.title_ar}' matched with challenge '{challenge.title}' (score: {score:.2%})",
            type=NotificationType.MATCH_FOUND,
        )
        db.add(notification)

    db.commit()

    # Refresh to get IDs
    for m in matches:
        db.refresh(m)

    return matches
