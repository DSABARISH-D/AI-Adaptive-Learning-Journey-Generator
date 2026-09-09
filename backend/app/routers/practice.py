"""Coding practice endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from services.ai_practice_service import (
    evaluate_code_with_gemini,
    generate_next_question_with_gemini,
    get_practice_questions,
    run_custom_testcase,
)

router = APIRouter(prefix="/api", tags=["practice"])


class PracticeSubmission(BaseModel):
    course: str = Field(min_length=1, max_length=30)
    level: int = Field(ge=1, le=3)
    language: str = Field(min_length=1, max_length=30)
    code: str = Field(max_length=100_000)
    question: dict[str, Any]


class PracticeRunRequest(BaseModel):
    code: str = Field(max_length=100_000)
    language: str = Field(min_length=1, max_length=30)
    input: str = Field(default="", max_length=20_000)


class NextQuestionRequest(BaseModel):
    course: str = Field(min_length=1, max_length=30)
    level: int = Field(ge=1, le=3)
    topic: str = Field(default="Coding Challenges", max_length=200)
    completedQuestions: list[dict[str, Any]] = Field(default_factory=list)


@router.get("/courses/{course_code}/practice")
def list_practice_questions(course_code: str, level: int = 3, topic: str = "") -> dict[str, Any]:
    """Return the local starter problem bank for a course and level."""
    if level not in (1, 2, 3):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Level must be 1, 2, or 3")

    questions = get_practice_questions(course_code, level)
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No practice questions found")

    selected_topic = topic.strip() or questions[0].get("topic", "Coding Challenges")
    return {
        "course": course_code.lower(),
        "courseTitle": f"{course_code.upper()} Programming",
        "level": level,
        "topic": selected_topic,
        "questions": questions,
    }


@router.post("/practice/run")
def run_practice_code(request: PracticeRunRequest) -> dict[str, Any]:
    """Run a custom test case through the practice service."""
    return run_custom_testcase(request.code, request.language, request.input)


@router.post("/practice/submit")
def submit_practice_code(request: PracticeSubmission) -> dict[str, Any]:
    """Evaluate a submission against the selected question's test cases."""
    return evaluate_code_with_gemini(request.code, request.language, request.question)


@router.post("/practice/next-question")
def next_practice_question(request: NextQuestionRequest) -> dict[str, Any]:
    """Generate the next question after a successful submission."""
    question = generate_next_question_with_gemini(
        request.course,
        request.level,
        request.topic,
        request.completedQuestions,
    )
    return {"ok": True, "question": question}