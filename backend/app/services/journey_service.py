"""Validate AI journey output against the topic graph, then persist a plan."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.learning_agent import AGENT_VERSION, plan_learning_journey
from app.agents.schemas import JourneyNode, LearningJourneyOutput
from app.models import Course, CourseTopic, Enrollment, LearningPlan, LearningPlanNode, StudentTopicProgress
from app.services.graph_service import eligible_topic_ids, load_edges, load_topics
from app.services.mastery_service import ensure_topic_rows, is_mastered, mastery_map

ALLOWED_AI_STATUSES = {"RECOMMENDED", "REVISION", "LOCKED"}
UI_STATUS = {
    "MASTERED": "completed",
    "RECOMMENDED": "recommended",
    "REVISION": "in-progress",
    "LOCKED": "locked",
}


def _course_meta(course: Course) -> dict[str, str]:
    return {
        "code": course.code,
        "title": course.title,
        "subtitle": course.title,
        "icon": course.code,
        "description": course.summary or "Your personalized learning journey based on assessment performance.",
        "level": "Beginner",
    }


def validate_plan(
    raw: LearningJourneyOutput,
    course: Course,
    topics: list[CourseTopic],
    edges: dict[int, list[int]],
    scores: dict[int, float | None],
) -> LearningJourneyOutput:
    by_code = {topic.code: topic for topic in topics}
    eligible = eligible_topic_ids(topics, edges, scores)
    known = set(by_code)
    if raw.course_id != course.code:
        raise ValueError("course_id mismatch")
    if raw.next_topic not in known:
        raise ValueError("unknown next_topic")
    if any(code not in known for code in raw.revision_topics):
        raise ValueError("unknown revision topic")
    if any("://" in (query.query or "") for query in raw.resource_queries):
        raise ValueError("fabricated resource URL")

    nodes: list[JourneyNode] = []
    seen: set[str] = set()
    for node in raw.nodes:
        topic = by_code.get(node.topic_id)
        if topic is None:
            raise ValueError("unknown topic_id")
        if node.topic_id in seen:
            continue
        seen.add(node.topic_id)
        prereq_codes = {topics_by_id(topics)[prereq_id].code for prereq_id in edges.get(topic.id, [])}
        if set(node.prerequisites) - prereq_codes:
            raise ValueError("invented prerequisite")
        backend_score = scores.get(topic.id)
        if is_mastered(backend_score):
            status = "MASTERED"
        elif topic.id not in eligible:
            status = "LOCKED"
        elif node.status == "MASTERED":
            status = "RECOMMENDED"
        elif node.status in ALLOWED_AI_STATUSES:
            status = node.status
        else:
            raise ValueError("invalid node status")
        minutes = min(240, max(5, node.estimated_minutes))
        nodes.append(
            node.model_copy(
                update={
                    "status": status,
                    "mastery_score": backend_score,
                    "prerequisites": sorted(prereq_codes),
                    "estimated_minutes": minutes,
                }
            )
        )

    missing = [topic for topic in topics if topic.code not in seen]
    for topic in missing:
        backend_score = scores.get(topic.id)
        prereq_codes = [topics_by_id(topics)[prereq_id].code for prereq_id in edges.get(topic.id, [])]
        if is_mastered(backend_score):
            status = "MASTERED"
            reason = "Backend mastery threshold met."
        elif topic.id not in eligible:
            status = "LOCKED"
            reason = "Prerequisite not mastered."
        else:
            status = "RECOMMENDED"
            reason = "Eligible topic omitted by the model; restored by backend validation."
        nodes.append(
            JourneyNode(
                topic_id=topic.code,
                status=status,
                mastery_score=backend_score,
                prerequisites=prereq_codes,
                reason=reason,
            )
        )

    next_topic = raw.next_topic
    next_model = by_code[next_topic]
    if next_model.id not in eligible or is_mastered(scores.get(next_model.id)):
        replacement = next(
            (topic for topic in topics if topic.id in eligible and not is_mastered(scores.get(topic.id))),
            next((topic for topic in topics if not is_mastered(scores.get(topic.id))), topics[0]),
        )
        next_topic = replacement.code

    return raw.model_copy(update={"nodes": nodes, "next_topic": next_topic, "course_id": course.code})


def topics_by_id(topics: list[CourseTopic]) -> dict[int, CourseTopic]:
    return {topic.id: topic for topic in topics}


def save_plan(
    db: Session,
    *,
    user_id: int,
    enrollment: Enrollment,
    course: Course,
    validated: LearningJourneyOutput,
    source: str,
    topics: list[CourseTopic],
) -> LearningPlan:
    by_code = {topic.code: topic for topic in topics}
    next_topic = by_code.get(validated.next_topic)
    plan = LearningPlan(
        user_id=user_id,
        course_id=course.id,
        enrollment_id=enrollment.id,
        summary=validated.summary,
        next_topic_id=next_topic.id if next_topic else None,
        agent_version=AGENT_VERSION,
        source=source,
    )
    db.add(plan)
    db.flush()
    for index, node in enumerate(validated.nodes):
        topic = by_code[node.topic_id]
        db.add(
            LearningPlanNode(
                plan_id=plan.id,
                topic_id=topic.id,
                status=node.status,
                mastery_score=node.mastery_score,
                reason=node.reason,
                estimated_minutes=node.estimated_minutes,
                order_index=index,
            )
        )
    return plan


def _ui_payload(
    course: Course,
    topics: list[CourseTopic],
    edges: dict[int, list[int]],
    progress: dict[int, StudentTopicProgress],
    plan: LearningPlan | None,
) -> dict[str, Any]:
    by_id = topics_by_id(topics)
    scores = {topic_id: row.score for topic_id, row in progress.items()}
    eligible = eligible_topic_ids(topics, edges, scores)
    reasons = {}
    if plan is not None:
        reasons = {node.topic_id: node.reason for node in plan.nodes}

    ui_topics = []
    performance = []
    current = topics[0].title if topics else ""
    weak = current
    weak_details = "Complete the baseline assessment to personalize this path."
    mastered_count = 0
    for topic in topics:
        score = scores.get(topic.id)
        mastered = is_mastered(score)
        if mastered:
            ui_status = "completed"
            mastered_count += 1
        elif topic.id not in eligible:
            ui_status = "locked"
        elif not any(item["defaultStatus"] == "in-progress" for item in ui_topics):
            ui_status = "in-progress"
        else:
            ui_status = "recommended"
        if plan is not None:
            node = next((item for item in plan.nodes if item.topic_id == topic.id), None)
            if node is not None:
                ui_status = UI_STATUS.get(node.status, ui_status)
        prereq_titles = [by_id[prereq].title for prereq in edges.get(topic.id, []) if prereq in by_id]
        ui_topics.append(
            {
                "id": topic.id,
                "title": topic.title,
                "subtopics": topic.description or ", ".join(prereq_titles) or "Foundational topics and key exercises",
                "defaultScore": 0 if score is None else round(score),
                "defaultStatus": ui_status,
                "order": topic.order,
            }
        )
        performance.append({"title": topic.title, "score": 0 if score is None else round(score), "status": ui_status})
        if ui_status in {"in-progress", "recommended"}:
            current = topic.title
            if score is not None and not mastered:
                weak = topic.title
                weak_details = reasons.get(topic.id) or f"Your {topic.title} score is {round(score)}%. Strengthen this topic before unlocking later work."

    progress_pct = round((mastered_count / len(topics)) * 100) if topics else 0
    summary = plan.summary if plan else f"Continue with {current}."
    return {
        "course": {**_course_meta(course), "progress": progress_pct},
        "topics": ui_topics,
        "currentTopic": current,
        "weakConcept": weak,
        "weakConceptDetails": weak_details,
        "performance": performance,
        "aiRecommendation": {
            "title": "You are doing great! 🎉",
            "message": summary,
            "weakConcept": weak,
            "buttonText": "View Recommended Resources →",
        },
        "plan": {
            "id": plan.id if plan else None,
            "source": plan.source if plan else "live",
            "summary": summary,
            "next_topic": current,
        },
    }


def current_journey(db: Session, user_id: int, course_code: str) -> dict[str, Any]:
    course, enrollment, topics, edges, progress = _load_context(db, user_id, course_code)
    plan = (
        db.scalars(
            select(LearningPlan)
            .where(LearningPlan.enrollment_id == enrollment.id, LearningPlan.user_id == user_id)
            .order_by(LearningPlan.created_at.desc())
        ).first()
    )
    payload = _ui_payload(course, topics, edges, progress, plan)
    payload["user"] = {"id": user_id}
    return payload


def generate_journey(db: Session, user_id: int, course_code: str) -> dict[str, Any]:
    course, enrollment, topics, edges, progress = _load_context(db, user_id, course_code)
    scores = {topic.id: progress[topic.id].score if topic.id in progress else None for topic in topics}
    raw, source = plan_learning_journey(db, user_id=user_id, course=course, enrollment_id=enrollment.id)
    try:
        validated = validate_plan(raw, course, topics, edges, scores)
    except ValueError:
        from app.agents.learning_agent import fallback_plan
        from app.agents.tools import get_learner_snapshot, get_question_stats, get_topic_graph, constrained_eligible_codes

        context = {
            "snapshot": get_learner_snapshot(db, user_id, course, enrollment.id),
            "graph": get_topic_graph(db, course.id),
            "stats": get_question_stats(get_learner_snapshot(db, user_id, course, enrollment.id)),
            "eligible": constrained_eligible_codes(db, course, enrollment.id),
        }
        validated = validate_plan(fallback_plan(context), course, topics, edges, scores)
        source = "fallback"

    plan = save_plan(
        db,
        user_id=user_id,
        enrollment=enrollment,
        course=course,
        validated=validated,
        source=source,
        topics=topics,
    )
    db.commit()
    db.refresh(plan)
    payload = _ui_payload(course, topics, edges, progress, plan)
    payload["user"] = {"id": user_id}
    payload["structured"] = validated.model_dump()
    return payload


def _load_context(db: Session, user_id: int, course_code: str) -> tuple[Course, Enrollment, list[CourseTopic], dict[int, list[int]], dict[int, StudentTopicProgress]]:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "Course not found"})
    enrollment = db.scalars(
        select(Enrollment).where(Enrollment.course_id == course.id, Enrollment.user_id == user_id)
    ).first()
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "Not enrolled in this course"})
    topics = load_topics(db, course.id)
    ensure_topic_rows(db, user_id, enrollment.id, topics)
    db.flush()
    edges = load_edges(db, [topic.id for topic in topics])
    progress = mastery_map(db, enrollment.id)
    return course, enrollment, topics, edges, progress
