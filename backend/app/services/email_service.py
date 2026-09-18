"""
Email Service
=============
Stdlib SMTP wrapper for outgoing mail. Best-effort: never raises, so callers
can run it as a background task. With an empty SMTP_HOST it only logs, which
keeps local/dev runs free of a mail server.
"""
import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str, reply_to: Optional[str] = None) -> bool:
    """Send a plain-text email. Returns True only when the SMTP server accepted it."""
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    if not settings.SMTP_HOST:
        logger.info(f"SMTP not configured — email to {to} skipped ({subject})")
        return False

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False
