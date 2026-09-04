from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_db
from app.models import BaselineQuiz, Course, Enrollment, User
from app.services.llm import get_llm

router = APIRouter(prefix="/api/courses", tags=["assessment"])


class QuestionOutput(BaseModel):
    text: str
    options: list[str]
    correct_index: int


class QuizOutput(BaseModel):
    questions: list[QuestionOutput]


class QuestionResponse(BaseModel):
    text: str
    options: list[str]


class QuizResponse(BaseModel):
    quiz_id: int
    questions: list[QuestionResponse]


class SubmitAnswers(BaseModel):
    quiz_id: int
    answers: list[int]


class ScoreResponse(BaseModel):
    score: int
    total: int


@router.get("/{course_code}/baseline", response_model=QuizResponse)
def get_baseline_quiz(
    course_code: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Course not found"})

    enrollment = db.scalars(
        select(Enrollment).where(Enrollment.course_id == course.id, Enrollment.user_id == user.id)
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Not enrolled in this course"})

    if enrollment.baseline_completed:
        raise HTTPException(
            status_code=400, detail={"code": "BAD_REQUEST", "message": "Baseline already completed"}
        )

    llm = get_llm()
    structured_llm = llm.with_structured_output(QuizOutput)

    prompt = (
        f"Generate a 5-question multiple choice baseline assessment quiz for the course '{course.title}'. "
        "Include 4 options per question."
    )
    try:
        result = structured_llm.invoke(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "LLM_ERROR", "message": f"Failed to generate quiz: {str(e)}"})

    quiz_json = result.model_dump()

    quiz = BaselineQuiz(enrollment_id=enrollment.id, questions_json=quiz_json)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    questions_no_ans = [
        QuestionResponse(text=q["text"], options=q["options"])
        for q in quiz_json.get("questions", [])
    ]

    return QuizResponse(quiz_id=quiz.id, questions=questions_no_ans)


@router.post("/{course_code}/baseline", response_model=ScoreResponse)
def submit_baseline_quiz(
    course_code: str,
    payload: SubmitAnswers,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    if not course:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Course not found"})

    enrollment = db.scalars(
        select(Enrollment).where(Enrollment.course_id == course.id, Enrollment.user_id == user.id)
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Not enrolled in this course"})

    quiz = db.scalars(
        select(BaselineQuiz).where(BaselineQuiz.id == payload.quiz_id, BaselineQuiz.enrollment_id == enrollment.id)
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Quiz not found"})

    questions = quiz.questions_json.get("questions", [])
    if len(payload.answers) != len(questions):
        raise HTTPException(
            status_code=400, detail={"code": "BAD_REQUEST", "message": "Incorrect number of answers"}
        )

    score = 0
    for idx, ans in enumerate(payload.answers):
        if ans == questions[idx]["correct_index"]:
            score += 1

    enrollment.baseline_score = score
    enrollment.baseline_completed = True
    db.commit()

    return ScoreResponse(score=score, total=len(questions))
