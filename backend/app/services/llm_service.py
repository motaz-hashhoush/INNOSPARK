"""
LLM Service
===========
Thin client around the self-hosted OpenAI-compatible LLM server (Qwen).
Used for:
  - Match reranking (smart matching stage 2)
  - Project description translation (Arabic <-> English)

All functions are best-effort: they return None on any failure so callers
can fall back to non-LLM behavior.
"""
import json
import logging
import re
from typing import Dict, List, Optional, Tuple

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-loaded client instance
_client = None

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)
_ARABIC_RE = re.compile(r"[؀-ۿ]")


def _get_client():
    """Lazy-load the OpenAI-compatible client for the self-hosted LLM."""
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(
            base_url=settings.LLM_BASE_URL,
            api_key=settings.LLM_API_KEY,
            timeout=settings.LLM_TIMEOUT,
        )
    return _client


def chat(system: str, user: str, max_tokens: int = 1024, temperature: float = 0.2) -> Optional[str]:
    """Send a chat completion request. Returns the cleaned text or None on failure."""
    try:
        client = _get_client()
        resp = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = resp.choices[0].message.content or ""
        # Qwen3 may emit <think>...</think> reasoning blocks — strip them
        content = _THINK_RE.sub("", content).strip()
        return content or None
    except Exception as e:
        logger.warning(f"LLM chat request failed: {e}")
        return None


def _extract_json(text: str):
    """Extract the first JSON object or array from LLM output."""
    if not text:
        return None
    # Strip markdown code fences
    text = re.sub(r"```(?:json)?", "", text).strip()
    for opener, closer in (("[", "]"), ("{", "}")):
        start = text.find(opener)
        if start == -1:
            continue
        end = text.rfind(closer)
        if end <= start:
            continue
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            continue
    return None


def detect_language(text: str) -> str:
    """Detect 'ar' or 'en' based on Arabic character ratio (no LLM call)."""
    if not text:
        return "en"
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return "en"
    arabic = sum(1 for c in letters if _ARABIC_RE.match(c))
    return "ar" if arabic / len(letters) > 0.3 else "en"


def translate_text(text: str, target_lang: str) -> Optional[str]:
    """Translate text to the target language ('ar' or 'en'). Returns None on failure."""
    if not text or not text.strip():
        return None
    lang_name = "Arabic" if target_lang == "ar" else "English"
    system = (
        f"You are a professional translator. Translate the user's text into {lang_name}. "
        "Preserve the meaning and technical terms. "
        "Respond with ONLY the translated text — no explanations, no notes."
    )
    return chat(system, text.strip(), max_tokens=2048, temperature=0.2)


def rerank_matches(
    challenge: Dict,
    candidates: List[Dict],
) -> Optional[Dict[int, Tuple[float, str]]]:
    """
    Ask the LLM to evaluate how well each candidate project solves the challenge.

    challenge: {title, description, sector, priorities, expected_outputs}
    candidates: [{project_id, title, summary, sector, technical_outputs, readiness_level}]

    Returns {project_id: (score_0_100, reason)} or None on failure.
    """
    if not candidates:
        return {}

    system = (
        "You are an expert innovation-matching evaluator for a university-industry platform. "
        "You will receive an industry CHALLENGE and a list of student PROJECTS. "
        "For EACH project, judge how well it actually solves the challenge's problem — "
        "consider the problem domain, the sector, the technical outputs, and readiness. "
        "Be strict: a project that is unrelated to the challenge's problem must get a low score (below 30), "
        "even if it uses similar buzzwords. Only genuinely relevant solutions score above 60.\n\n"
        "Respond with ONLY a JSON array, one item per project, in this exact format:\n"
        '[{"project_id": 1, "score": 85, "reason": "one short sentence why"}]'
    )

    payload = {
        "challenge": challenge,
        "projects": candidates,
    }
    user = json.dumps(payload, ensure_ascii=False)

    raw = chat(system, user, max_tokens=2048, temperature=0.1)
    if raw is None:
        return None

    data = _extract_json(raw)
    if not isinstance(data, list):
        logger.warning("LLM rerank returned unparseable output")
        return None

    results: Dict[int, Tuple[float, str]] = {}
    for item in data:
        try:
            pid = int(item["project_id"])
            score = float(item["score"])
            reason = str(item.get("reason", "")).strip()
            results[pid] = (max(0.0, min(100.0, score)), reason)
        except (KeyError, TypeError, ValueError):
            continue

    return results or None
