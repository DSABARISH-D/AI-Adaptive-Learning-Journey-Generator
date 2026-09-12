"""AI Tutor conversation endpoint."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_db
from app.models import User
try:
    from backend.services.llm_tutor_service import generate_tutor_reply
except ImportError:
    from services.llm_tutor_service import generate_tutor_reply

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


class TutorMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    course_code: str = Field(default="java")
    topic: str = Field(default="")
    level: str = Field(default="beginner")


@router.post("/messages")
def send_tutor_message(
    payload: TutorMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Generate an AI Tutor response grounded in the course, topic, and learner state."""
    profile = {
        "user_id": user.id,
        "email": user.email,
        "topics": [payload.topic] if payload.topic else [payload.course_code],
        "level": payload.level,
    }
    reply = generate_tutor_reply(payload.message, profile, [])
    return {
        "reply": reply.answer,
        "detected_topic": reply.detected_topic,
        "mode": reply.mode,
        "retrieved_chunks": reply.retrieved_chunks,
        "related_resources": reply.related_resources,
    }
