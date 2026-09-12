"""Journey generation and current-plan endpoints. Identity comes from the verified token."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_db
from app.models import User
from app.services.journey_service import current_journey, generate_journey
from app.services.mastery_service import mastery_map
from app.services.graph_service import load_topics
from app.models import Course, Enrollment
from sqlalchemy import select

router = APIRouter(tags=["journeys"])


class GenerateJourneyRequest(BaseModel):
    course_code: str


@router.get("/api/courses/{course_code}/journey")
def get_course_journey(course_code: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    return current_journey(db, user.id, course_code)


@router.get("/api/journeys/current")
def get_current_journey(course_code: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    return current_journey(db, user.id, course_code)


@router.post("/api/journeys/generate")
def post_generate_journey(
    payload: GenerateJourneyRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    return generate_journey(db, user.id, payload.course_code)


@router.get("/api/me/mastery")
def get_my_mastery(course_code: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    if course is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "Course not found"})
    enrollment = db.scalars(
        select(Enrollment).where(Enrollment.course_id == course.id, Enrollment.user_id == user.id)
    ).first()
    if enrollment is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "Not enrolled in this course"})
    topics = load_topics(db, course.id)
    progress = mastery_map(db, enrollment.id)
    return {
        "course_code": course.code,
        "threshold": 70.0,
        "topics": [
            {
                "topic_id": topic.code,
                "title": topic.title,
                "score": progress[topic.id].score if topic.id in progress else None,
                "status": progress[topic.id].status if topic.id in progress else "NEEDS_REVISION",
            }
            for topic in topics
        ],
    }
