"""Deterministic topic scoring and mastery status. The AI cannot override this."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CourseTopic, StudentTopicProgress

MASTERY_THRESHOLD = 70.0
MASTERED = "MASTERED"
NEEDS_REVISION = "NEEDS_REVISION"


def topic_score(earned_points: float, available_points: float) -> float:
    if available_points <= 0:
        return 0.0
    return (earned_points / available_points) * 100.0


def mastery_status(score: float, threshold: float = MASTERY_THRESHOLD) -> str:
    return MASTERED if score >= threshold else NEEDS_REVISION


def is_mastered(score: float | None, threshold: float = MASTERY_THRESHOLD) -> bool:
    return score is not None and score >= threshold


def upsert_topic_mastery(
    db: Session,
    *,
    user_id: int,
    enrollment_id: int,
    topic_id: int,
    score: float | None,
) -> StudentTopicProgress:
    progress = db.scalars(
        select(StudentTopicProgress).where(
            StudentTopicProgress.enrollment_id == enrollment_id,
            StudentTopicProgress.topic_id == topic_id,
        )
    ).first()
    if progress is None:
        progress = StudentTopicProgress(
            user_id=user_id,
            enrollment_id=enrollment_id,
            topic_id=topic_id,
        )
        db.add(progress)

    progress.score = None if score is None else round(float(score), 4)
    if progress.score is None:
        progress.status = NEEDS_REVISION
    else:
        progress.status = mastery_status(progress.score)
        if progress.status == MASTERED:
            progress.completed_at = progress.completed_at or datetime.utcnow()
    return progress


def mastery_map(db: Session, enrollment_id: int) -> dict[int, StudentTopicProgress]:
    rows = db.scalars(
        select(StudentTopicProgress).where(StudentTopicProgress.enrollment_id == enrollment_id)
    ).all()
    return {row.topic_id: row for row in rows}


def ensure_topic_rows(db: Session, user_id: int, enrollment_id: int, topics: list[CourseTopic]) -> None:
    existing = mastery_map(db, enrollment_id)
    for topic in topics:
        if topic.id not in existing:
            db.add(
                StudentTopicProgress(
                    user_id=user_id,
                    enrollment_id=enrollment_id,
                    topic_id=topic.id,
                    score=None,
                    status=NEEDS_REVISION,
                )
            )
