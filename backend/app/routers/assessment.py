from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_db
from app.models import AssessmentAnswer, AssessmentAttempt, BaselineQuiz, Course, CourseTopic, Enrollment, LearningActivity, StudentTopicProgress, TopicAssessment, User
from app.services.graph_service import load_topics
from app.services.llm import get_llm
from app.services.mastery_service import MASTERED, upsert_topic_mastery

router = APIRouter(prefix="/api/courses", tags=["assessment"])


class QuestionOutput(BaseModel):
    text: str
    options: list[str]
    correct_index: int
    topic: str | None = None


class QuizOutput(BaseModel):
    questions: list[QuestionOutput]


class QuestionResponse(BaseModel):
    text: str
    options: list[str]
    topic: str | None = None


class QuizResponse(BaseModel):
    quiz_id: int
    questions: list[QuestionResponse]


class SubmitAnswers(BaseModel):
    quiz_id: int
    answers: list[int]


class ScoreResponse(BaseModel):
    score: int
    total: int


class TopicResult(BaseModel):
    topic: str
    score: int | None
    status: str


class AssessmentResultResponse(BaseModel):
    score: int
    total: int
    percentage: int
    strong_topics: list[TopicResult]
    medium_topics: list[TopicResult]
    weak_topics: list[TopicResult]


def _topic_questions(topic: CourseTopic) -> dict[str, list[dict[str, object]]]:
    """Provide a deterministic starter assessment until question generation is enabled."""
    return {"questions": [
        {"text": f"Which statement best describes {topic.title}?", "options": [topic.title, "A database table", "A network protocol", "A file format"], "correct_index": 0},
        {"text": f"What is the first useful step when learning {topic.title}?", "options": ["Memorize everything", "Understand a small example", "Skip practice", "Avoid feedback"], "correct_index": 1},
        {"text": f"Which approach improves skill with {topic.title}?", "options": ["Repeated practice", "Never reviewing mistakes", "Guessing only", "Removing examples"], "correct_index": 0},
        {"text": f"When debugging {topic.title}, what should a learner do?", "options": ["Trace the behavior", "Delete the code", "Ignore the output", "Change every line"], "correct_index": 0},
        {"text": f"How should progress in {topic.title} be checked?", "options": ["With evidence and practice", "Only by confidence", "Without feedback", "By skipping assessment"], "correct_index": 0},
    ]}


def _assign_question_topics(quiz_json: dict[str, list[dict[str, object]]], topics: list[CourseTopic]) -> dict[str, list[dict[str, object]]]:
    topic_names = [topic.title for topic in topics]
    for index, question in enumerate(quiz_json.get("questions", [])):
        question["topic"] = str(question.get("topic") or (topic_names[index % len(topic_names)] if topic_names else "General"))
    return quiz_json


@router.get("/{course_code}/topics/{topic_id}/assessment", response_model=QuizResponse)
def get_topic_assessment(course_code: str, topic_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> QuizResponse:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    topic = db.scalars(select(CourseTopic).where(CourseTopic.id == topic_id, CourseTopic.course_id == course.id if course else False)).first()
    enrollment = db.scalars(select(Enrollment).where(Enrollment.course_id == course.id if course else False, Enrollment.user_id == user.id)).first()
    if course is None or topic is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Course topic not found"})
    if enrollment is None:
        raise HTTPException(status_code=403, detail={"code": "FORBIDDEN", "message": "Not enrolled in this course"})

    quiz_json = _topic_questions(topic)
    assessment = TopicAssessment(enrollment_id=enrollment.id, topic_id=topic.id, questions_json=quiz_json)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return QuizResponse(quiz_id=assessment.id, questions=[QuestionResponse(text=item["text"], options=item["options"], topic=str(item.get("topic") or topic.title)) for item in quiz_json["questions"]])


@router.post("/{course_code}/topics/{topic_id}/assessment", response_model=ScoreResponse)
def submit_topic_assessment(course_code: str, topic_id: int, payload: SubmitAnswers, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ScoreResponse:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    enrollment = db.scalars(select(Enrollment).where(Enrollment.course_id == course.id if course else False, Enrollment.user_id == user.id)).first()
    assessment = db.scalars(select(TopicAssessment).where(TopicAssessment.id == payload.quiz_id, TopicAssessment.topic_id == topic_id, TopicAssessment.enrollment_id == enrollment.id if enrollment else False)).first()
    if course is None or enrollment is None or assessment is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Topic assessment not found"})
    questions = assessment.questions_json.get("questions", [])
    if len(payload.answers) != len(questions):
        raise HTTPException(status_code=400, detail={"code": "BAD_REQUEST", "message": "Incorrect number of answers"})

    earned = sum(1.0 for answer, question in zip(payload.answers, questions) if answer == question["correct_index"])
    available = float(len(questions))
    percentage = (earned / available) * 100.0 if available else 0.0
    upsert_topic_mastery(db, user_id=user.id, enrollment_id=enrollment.id, topic_id=topic_id, score=percentage)
    attempt = AssessmentAttempt(user_id=user.id, enrollment_id=enrollment.id, assessment_type="topic", score=int(earned), total=len(questions))
    db.add(attempt)
    db.flush()
    for index, (answer, question) in enumerate(zip(payload.answers, questions)):
        correct = answer == question["correct_index"]
        db.add(AssessmentAnswer(attempt_id=attempt.id, question_index=index, topic_id=topic_id, selected_index=answer, is_correct=correct, earned_points=1.0 if correct else 0.0))
    db.add(LearningActivity(user_id=user.id, enrollment_id=enrollment.id, activity_type="topic_assessment", title=f"Completed {assessment.topic.title} assessment", score=int(round(percentage)), minutes=10))
    db.commit()
    return ScoreResponse(score=int(earned), total=len(questions))


@router.get("/{course_code}/baseline/{quiz_id}/result", response_model=AssessmentResultResponse)
def get_baseline_result(course_code: str, quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> AssessmentResultResponse:
    course = db.scalars(select(Course).where(Course.code == course_code)).first()
    enrollment = db.scalars(select(Enrollment).where(Enrollment.course_id == course.id if course else False, Enrollment.user_id == user.id)).first()
    quiz = db.scalars(select(BaselineQuiz).where(BaselineQuiz.id == quiz_id, BaselineQuiz.enrollment_id == enrollment.id if enrollment else False)).first()
    attempt = db.scalars(select(AssessmentAttempt).where(AssessmentAttempt.enrollment_id == enrollment.id if enrollment else False, AssessmentAttempt.assessment_type == "baseline").order_by(AssessmentAttempt.created_at.desc())).first()
    if course is None or enrollment is None or quiz is None or attempt is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Assessment result not found"})

    progress_rows = db.scalars(select(StudentTopicProgress).where(StudentTopicProgress.enrollment_id == enrollment.id)).all()
    results = [TopicResult(topic=row.topic.title, score=None if row.score is None else round(row.score), status=row.status) for row in progress_rows if row.topic is not None]
    return AssessmentResultResponse(
        score=attempt.score,
        total=attempt.total,
        percentage=round(attempt.score / attempt.total * 100) if attempt.total else 0,
        strong_topics=[result for result in results if result.status == MASTERED],
        medium_topics=[],
        weak_topics=[result for result in results if result.status != MASTERED],
    )


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

    quiz_json = _assign_question_topics(result.model_dump(), load_topics(db, course.id))

    quiz = BaselineQuiz(enrollment_id=enrollment.id, questions_json=quiz_json)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    questions_no_ans = [
        QuestionResponse(text=q["text"], options=q["options"], topic=str(q.get("topic") or "General"))
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
    attempt = AssessmentAttempt(user_id=user.id, enrollment_id=enrollment.id, score=score, total=len(questions))
    db.add(attempt)
    db.flush()

    topics = load_topics(db, course.id)
    topics_by_name = {topic.title: topic for topic in topics}
    topic_points: dict[int, list[tuple[float, float]]] = {topic.id: [] for topic in topics}
    for index, answer in enumerate(payload.answers):
        question_topic = topics_by_name.get(str(questions[index].get("topic", ""))) if topics else None
        selected_topic = question_topic or (topics[index % len(topics)] if topics else None)
        correct = answer == questions[index]["correct_index"]
        if selected_topic:
            topic_points[selected_topic.id].append((1.0 if correct else 0.0, 1.0))
            db.add(
                AssessmentAnswer(
                    attempt_id=attempt.id,
                    question_index=index,
                    topic_id=selected_topic.id,
                    selected_index=answer,
                    is_correct=correct,
                    earned_points=1.0 if correct else 0.0,
                )
            )
    for topic in topics:
        points = topic_points[topic.id]
        topic_score = (sum(earned for earned, _ in points) / sum(available for _, available in points) * 100.0) if points else None
        upsert_topic_mastery(db, user_id=user.id, enrollment_id=enrollment.id, topic_id=topic.id, score=topic_score)
    db.commit()

    return ScoreResponse(score=score, total=len(questions))
