"""
AI Matching Service
===================
Smart multi-signal matching between industry challenges and student projects.

Pipeline (see find_matches):
  Stage 1 — structured hybrid scoring per project:
      0.45 * semantic embedding similarity
    + 0.25 * sector alignment (challenge enum vs normalized project sector)
    + 0.20 * TF-IDF keyword overlap
    + 0.10 * readiness level
    Projects below MATCH_MIN_SCORE are dropped (prevents irrelevant projects
    from always filling the top-k).
  Stage 2 — LLM rerank (optional, best-effort): the top candidates are sent to
    the self-hosted LLM which scores true problem/solution fit; final score is
    a blend, and LLM-rejected candidates are removed. Falls back silently to
    stage-1 ordering when the LLM is unavailable.
"""
import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
from sqlalchemy.orm import Session

from app.config import settings
from app.models.project import ApprovalStatus, Project, ReadinessLevel
from app.models.challenge import Challenge
from app.models.match import Match, MatchStatus
from app.models.notification import Notification, NotificationType
from app.services import llm_service

logger = logging.getLogger(__name__)

# Lazy-loaded model instance
_model = None


def _get_model():
    """Lazy-load the sentence-transformers model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading AI model: {settings.AI_MODEL_NAME}")
            _model = SentenceTransformer(settings.AI_MODEL_NAME)
            _model.max_seq_length = settings.AI_MAX_SEQ_LENGTH
            logger.info(f"AI model loaded successfully with max_seq_length: {settings.AI_MAX_SEQ_LENGTH}")
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
    if project.title:
        parts.append(project.title)
    if project.summary:
        parts.append(project.summary)
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


# ── Structured scoring signals ───────────────────────────────────────────────

# Weights of the hybrid score (must sum to 1.0)
W_SEMANTIC = 0.45
W_SECTOR = 0.25
W_KEYWORDS = 0.20
W_READINESS = 0.10

# Free-text project sector → canonical Sector enum value
_SECTOR_KEYWORDS = {
    "health": ["health", "medical", "medicine", "hospital", "clinic", "pharma", "biotech", "صحة", "طب"],
    "environment": ["environment", "climate", "water", "waste", "recycl", "green", "sustainab", "بيئة", "مياه"],
    "energy": ["energy", "solar", "power", "electric", "renewable", "battery", "طاقة", "شمسية", "كهرباء"],
    "agriculture": ["agricultur", "farm", "crop", "irrigation", "livestock", "food", "زراعة", "ري"],
    "industry": ["industr", "manufactur", "factory", "mechanical", "logistics", "supply chain", "صناعة", "تصنيع"],
    "information_technology": ["information_technology", "information technology", "software", "ai", "artificial intelligence",
                               "machine learning", "data", "iot", "app", "web", "cyber", "tech", "it",
                               "برمجيات", "ذكاء اصطناعي", "تقنية"],
    "education": ["education", "learning", "school", "university", "teaching", "تعليم", "تعلم"],
}

_READINESS_SCORE = {
    ReadinessLevel.PILOT_READY: 1.0,
    ReadinessLevel.PROTOTYPE: 0.7,
    ReadinessLevel.CONCEPT: 0.4,
}


def normalize_sector(sector_text: Optional[str]) -> Optional[str]:
    """Map a free-text project sector to a canonical Sector enum value."""
    if not sector_text:
        return None
    text = sector_text.strip().lower()
    if not text or text == "other":
        return "other"
    for canonical, keywords in _SECTOR_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return canonical
    return "other"


def _sector_score(challenge_sector: Optional[str], project_sector: Optional[str]) -> float:
    """Score sector alignment between a challenge (enum value) and a project (free text)."""
    if not challenge_sector or challenge_sector == "other":
        return 0.5  # challenge has no specific sector — neutral
    normalized = normalize_sector(project_sector)
    if normalized is None or normalized == "other":
        return 0.5  # unknown project sector — neutral
    return 1.0 if normalized == challenge_sector else 0.15


def _keyword_scores(challenge_text: str, project_texts: List[str]) -> List[float]:
    """TF-IDF cosine similarity between the challenge text and each project text."""
    if not challenge_text.strip() or not project_texts:
        return [0.0] * len(project_texts)
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        corpus = [challenge_text] + [t if t.strip() else " " for t in project_texts]
        matrix = TfidfVectorizer(stop_words="english", max_features=5000).fit_transform(corpus)
        sims = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        return [float(s) for s in sims]
    except Exception as e:
        logger.warning(f"TF-IDF keyword scoring failed: {e}")
        return [0.0] * len(project_texts)


# ── Matching pipeline ────────────────────────────────────────────────────────

def find_matches(
    db: Session,
    *,
    title: str,
    description: str,
    sector: Optional[str],
    priorities: Optional[str] = None,
    expected_outputs: Optional[str] = None,
    embedding: Optional[List[float]] = None,
    top_k: int = 10,
) -> List[Tuple[Project, float, Optional[str]]]:
    """
    Run the smart matching pipeline for a challenge (persisted or ad-hoc).

    Returns a list of (project, final_score_0_1, reason) sorted by score,
    already filtered by MATCH_MIN_SCORE. Empty list = no relevant projects.
    """
    challenge_parts = [p for p in (title, description, priorities, expected_outputs) if p]
    challenge_text = " ".join(challenge_parts)

    if embedding is None:
        embedding = generate_embedding(challenge_text)

    # Only supervisor-approved projects are eligible for matching
    projects = (
        db.query(Project)
        .filter(
            Project.embedding.isnot(None),
            Project.approval_status == ApprovalStatus.APPROVED,
        )
        .all()
    )
    if not projects:
        return []

    sector_value = sector.value if hasattr(sector, "value") else sector

    # Stage 1 — structured hybrid scoring
    project_texts = [
        " ".join(filter(None, [p.technical_outputs, p.problem, p.summary, p.title]))
        for p in projects
    ]
    kw_scores = _keyword_scores(challenge_text, project_texts)

    scored: List[Tuple[Project, float]] = []
    for project, kw_score in zip(projects, kw_scores):
        semantic = compute_similarity(embedding, project.embedding)
        composite = (
            W_SEMANTIC * semantic
            + W_SECTOR * _sector_score(sector_value, project.sector)
            + W_KEYWORDS * kw_score
            + W_READINESS * _READINESS_SCORE.get(project.readiness_level, 0.4)
        )
        if composite >= settings.MATCH_MIN_SCORE:
            scored.append((project, composite))

    scored.sort(key=lambda x: x[1], reverse=True)
    candidates = scored[:max(settings.MATCH_CANDIDATE_POOL, top_k)]
    if not candidates:
        return []

    # Stage 2 — LLM rerank (best-effort)
    results: List[Tuple[Project, float, Optional[str]]] = []
    llm_scores = None
    if settings.LLM_RERANK_ENABLED:
        llm_scores = llm_service.rerank_matches(
            challenge={
                "title": title,
                "description": description,
                "sector": sector_value,
                "priorities": priorities,
                "expected_outputs": expected_outputs,
            },
            candidates=[
                {
                    "project_id": p.id,
                    "title": p.title,
                    "summary": p.summary or p.problem,
                    "sector": p.sector,
                    "technical_outputs": p.technical_outputs,
                    "readiness_level": p.readiness_level.value if p.readiness_level else None,
                }
                for p, _ in candidates
            ],
        )

    if llm_scores:
        for project, structured in candidates:
            llm_score, reason = llm_scores.get(project.id, (None, None))
            if llm_score is None:
                # LLM didn't score this project — keep structured score, no reason
                results.append((project, structured, None))
                continue
            if llm_score < 30:
                continue  # LLM judged it irrelevant
            blended = 0.6 * (llm_score / 100.0) + 0.4 * structured
            results.append((project, blended, reason or None))
        results.sort(key=lambda x: x[1], reverse=True)
    else:
        if settings.LLM_RERANK_ENABLED:
            logger.warning("LLM rerank unavailable — falling back to structured scores")
        results = [(p, s, None) for p, s in candidates]

    return results[:top_k]


def run_matching(db: Session, challenge_id: int, top_k: int = 10) -> List[Match]:
    """Run smart matching for a persisted challenge and store Match records."""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        return []

    # Ensure challenge has embedding
    if not challenge.embedding:
        embed_challenge(db, challenge)
        if not challenge.embedding:
            return []

    ranked = find_matches(
        db,
        title=challenge.title,
        description=challenge.description,
        sector=challenge.sector,
        priorities=challenge.priorities,
        expected_outputs=challenge.expected_outputs,
        embedding=challenge.embedding,
        top_k=top_k,
    )

    # Remove stale suggestions from previous runs, but keep matches the
    # company already accepted/rejected.
    db.query(Match).filter(
        Match.challenge_id == challenge_id,
        Match.status == MatchStatus.SUGGESTED,
    ).delete(synchronize_session=False)

    matches = []
    for project, score, reason in ranked:
        existing = db.query(Match).filter(
            Match.project_id == project.id,
            Match.challenge_id == challenge_id,
        ).first()

        if existing:
            existing.similarity_score = round(score, 4)
            existing.reason = reason
            match = existing
        else:
            match = Match(
                project_id=project.id,
                challenge_id=challenge_id,
                similarity_score=round(score, 4),
                reason=reason,
                status=MatchStatus.SUGGESTED,
            )
            db.add(match)

        matches.append(match)

        # Create notification for project creator (skip for guest challenges)
        if not challenge.is_guest and project.created_by:
            notification = Notification(
                user_id=project.created_by,
                message=f"Your project '{project.title}' matched with challenge '{challenge.title}' (score: {score:.2%})",
                type=NotificationType.MATCH_FOUND,
            )
            db.add(notification)

    db.commit()

    # Refresh to get IDs
    for m in matches:
        db.refresh(m)

    return matches
