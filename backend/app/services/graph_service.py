"""Course topic graph and prerequisite unlocking. Topic IDs and edges come from the database."""

from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CourseTopic, TopicPrerequisite
from app.services.mastery_service import is_mastered

TOPIC_CODE_ALIASES = {
    "basics": "basics",
    "introduction to java": "basics",
    "variables & operators": "variables",
    "variables and data types": "variables",
    "variables and operators": "variables",
    "operators": "variables",
    "conditional statements": "conditionals",
    "control flow": "conditionals",
    "loops": "loops",
    "methods": "methods",
    "functions": "methods",
    "oop concepts": "oop",
    "oop in python": "oop",
    "classes and objects": "oop",
    "exception handling": "exceptions",
}


def slugify_topic(title: str) -> str:
    key = title.strip().lower()
    if key in TOPIC_CODE_ALIASES:
        return TOPIC_CODE_ALIASES[key]
    slug = re.sub(r"[^a-z0-9]+", "-", key).strip("-")
    return slug or "topic"


def load_topics(db: Session, course_id: int) -> list[CourseTopic]:
    return list(
        db.scalars(select(CourseTopic).where(CourseTopic.course_id == course_id).order_by(CourseTopic.order)).all()
    )


def load_edges(db: Session, topic_ids: list[int]) -> dict[int, list[int]]:
    if not topic_ids:
        return {}
    rows = db.scalars(select(TopicPrerequisite).where(TopicPrerequisite.topic_id.in_(topic_ids))).all()
    edges: dict[int, list[int]] = {topic_id: [] for topic_id in topic_ids}
    for row in rows:
        edges.setdefault(row.topic_id, []).append(row.prerequisite_topic_id)
    return edges


def eligible_topic_ids(
    topics: list[CourseTopic],
    edges: dict[int, list[int]],
    scores: dict[int, float | None],
) -> set[int]:
    eligible: set[int] = set()
    for topic in topics:
        prereqs = edges.get(topic.id, [])
        if all(is_mastered(scores.get(prereq_id)) for prereq_id in prereqs):
            eligible.add(topic.id)
    return eligible


def seed_linear_prerequisites(db: Session, topics: list[CourseTopic]) -> None:
    """Idempotent chain: each topic depends on the previous ordered topic."""
    ordered = sorted(topics, key=lambda topic: topic.order)
    for previous, current in zip(ordered, ordered[1:]):
        exists = db.scalars(
            select(TopicPrerequisite).where(
                TopicPrerequisite.topic_id == current.id,
                TopicPrerequisite.prerequisite_topic_id == previous.id,
            )
        ).first()
        if exists is None:
            db.add(TopicPrerequisite(topic_id=current.id, prerequisite_topic_id=previous.id))
