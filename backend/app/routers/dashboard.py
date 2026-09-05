from __future__ import annotations

from datetime import datetime, time

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_db
from app.models import AssessmentAttempt, CourseTopic, Enrollment, LearningActivity, StudentTopicProgress, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class ActivityInput(BaseModel):
    activity_type: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=200)
    minutes: int = Field(default=0, ge=0, le=240)
    score: int | None = Field(default=None, ge=0, le=100)
    enrollment_id: int | None = None


@router.post("/activity", status_code=201)
def record_activity(payload: ActivityInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, int | str]:
    enrollment = None
    if payload.enrollment_id is not None:
        enrollment = db.scalars(select(Enrollment).where(Enrollment.id == payload.enrollment_id, Enrollment.user_id == user.id)).first()
        if enrollment is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Enrollment not found")
    activity = LearningActivity(user_id=user.id, enrollment_id=enrollment.id if enrollment else None, activity_type=payload.activity_type, title=payload.title, minutes=payload.minutes, score=payload.score)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"id": activity.id, "status": "recorded"}


@router.get("")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    enrollments = db.scalars(select(Enrollment).where(Enrollment.user_id == user.id).order_by(Enrollment.enrolled_at.desc())).all()
    attempts = db.scalars(select(AssessmentAttempt).where(AssessmentAttempt.user_id == user.id).order_by(AssessmentAttempt.created_at.desc())).all()
    activities = db.scalars(select(LearningActivity).where(LearningActivity.user_id == user.id).order_by(LearningActivity.created_at.desc()).limit(8)).all()
    progress_rows = db.scalars(select(StudentTopicProgress).where(StudentTopicProgress.user_id == user.id)).all()
    completed_topics = [row for row in progress_rows if row.status == "completed"]
    average_score = round(sum((attempt.score / attempt.total) * 100 for attempt in attempts) / len(attempts)) if attempts else 0
    active = next((enrollment for enrollment in enrollments if enrollment.status == "active"), None)
    topics = db.scalars(select(CourseTopic).where(CourseTopic.course_id == active.course_id).order_by(CourseTopic.order)).all() if active else []
    active_progress = {row.topic_id: row for row in progress_rows if active and row.enrollment_id == active.id}
    current_topic = next((topic for topic in topics if active_progress.get(topic.id, None) is None or active_progress[topic.id].status != "completed"), None)
    overall = round(len(completed_topics) / len(progress_rows) * 100) if progress_rows else (100 if active and active.baseline_completed else 0)
    weak = next((row for row in active_progress.values() if row.score is not None and row.score < 70), None)
    recommendation_topic = weak.topic.title if weak else (current_topic.title if current_topic else "your next topic")
    today = datetime.combine(datetime.utcnow().date(), time.min)
    daily_minutes = sum(activity.minutes for activity in activities if activity.created_at >= today)
    roadmap = [{"title": topic.title, "description": topic.description, "status": active_progress.get(topic.id).status if topic.id in active_progress else ("in_progress" if topic == current_topic else "upcoming"), "score": active_progress.get(topic.id).score if topic.id in active_progress else None} for topic in topics]
    return {
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "avatar_url": user.avatar_url},
        "stats": {"overall_progress": overall, "courses_enrolled": len(enrollments), "topics_completed": len(completed_topics), "assessments_attempted": len(attempts), "average_score": average_score, "latest_score": round(attempts[0].score / attempts[0].total * 100) if attempts else None},
        "current_course": {"code": active.course.code, "title": active.course.title} if active and active.course else None,
        "current_topic": {"title": current_topic.title, "description": current_topic.description} if current_topic else None,
        "roadmap": roadmap,
        "recommendation": {"topic": recommendation_topic, "message": f"Focus on {recommendation_topic} to strengthen your current learning path.", "priority": "revision" if weak else "next"},
        "recent_activity": [{"type": activity.activity_type, "title": activity.title, "score": activity.score, "created_at": activity.created_at.isoformat()} for activity in activities],
        "daily_goal": {"minutes": daily_minutes, "target": 10},
        "upcoming_tasks": ([{"title": f"Complete {current_topic.title} lesson", "kind": "lesson"}, {"title": f"Take {current_topic.title} assessment", "kind": "assessment"}] if current_topic else []),
    }