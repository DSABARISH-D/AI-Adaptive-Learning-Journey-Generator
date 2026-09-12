"""Narrow, user-scoped tools for the learning journey agent. Read-only except save_learning_plan."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import Course, CourseTopic, StudentTopicProgress
from app.services.graph_service import eligible_topic_ids, load_edges, load_topics
from app.services.mastery_service import MASTERY_THRESHOLD, is_mastered


def get_learner_snapshot(db: Session, user_id: int, course: Course, enrollment_id: int) -> dict[str, Any]:
    topics = load_topics(db, course.id)
    progress = {
        row.topic_id: row
        for row in db.query(StudentTopicProgress)
        .filter(StudentTopicProgress.enrollment_id == enrollment_id, StudentTopicProgress.user_id == user_id)
        .all()
    }
    return {
        "course_id": course.code,
        "course_title": course.title,
        "topics": [
            {
                "topic_id": topic.code,
                "title": topic.title,
                "score": progress[topic.id].score if topic.id in progress else None,
                "status": progress[topic.id].status if topic.id in progress else "NEEDS_REVISION",
            }
            for topic in topics
        ],
        "threshold": MASTERY_THRESHOLD,
    }


def get_topic_graph(db: Session, course_id: int) -> dict[str, Any]:
    topics = load_topics(db, course_id)
    by_id = {topic.id: topic for topic in topics}
    edges = load_edges(db, [topic.id for topic in topics])
    return {
        "nodes": [{"topic_id": topic.code, "title": topic.title, "order": topic.order} for topic in topics],
        "edges": [
            {"topic_id": by_id[topic_id].code, "prerequisites": [by_id[prereq].code for prereq in prereqs if prereq in by_id]}
            for topic_id, prereqs in edges.items()
            if topic_id in by_id
        ],
    }


def get_question_stats(snapshot: dict[str, Any]) -> dict[str, Any]:
    mastered = [item["topic_id"] for item in snapshot["topics"] if is_mastered(item["score"])]
    weak = [item["topic_id"] for item in snapshot["topics"] if item["score"] is not None and not is_mastered(item["score"])]
    return {"mastered": mastered, "weak": weak, "unscored": [item["topic_id"] for item in snapshot["topics"] if item["score"] is None]}


def constrained_eligible_codes(db: Session, course: Course, enrollment_id: int) -> list[str]:
    topics = load_topics(db, course.id)
    edges = load_edges(db, [topic.id for topic in topics])
    progress = {
        row.topic_id: row.score
        for row in db.query(StudentTopicProgress).filter(StudentTopicProgress.enrollment_id == enrollment_id).all()
    }
    eligible = eligible_topic_ids(topics, edges, progress)
    return [topic.code for topic in topics if topic.id in eligible]


def topic_by_code(topics: list[CourseTopic], code: str) -> CourseTopic | None:
    wanted = code.strip().lower()
    return next((topic for topic in topics if topic.code.lower() == wanted), None)
