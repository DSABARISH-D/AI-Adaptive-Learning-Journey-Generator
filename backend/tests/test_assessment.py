"""Tests for baseline assessment."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import BaselineQuiz, Course, Enrollment, User
from app.routers.assessment import QuestionOutput, QuizOutput

client = TestClient(app)


class _DummyResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


def _login(monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setattr(
        "app.auth.httpx.post",
        lambda *_args, **_kwargs: _DummyResponse({"id_token": "dummy.token", "access_token": "token"}),
    )
    monkeypatch.setattr(
        "app.auth.httpx.get",
        lambda *_args, **_kwargs: _DummyResponse({
            "email": "student@example.com",
            "name": "Student User",
            "picture": "https://example.com/avatar.png",
            "sub": "google-123",
        }),
    )
    response = client.get("/api/auth/google/callback?code=test-code&state=test-state&format=json")
    return response.json()["token"]


def test_get_baseline_quiz_success(monkeypatch: pytest.MonkeyPatch):
    token = _login(monkeypatch)
    db = SessionLocal()
    
    course = db.query(Course).filter(Course.code == "python").first()
    user = db.query(User).filter(User.email == "student@example.com").first()
    
    # ensure enrollment exists
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db.add(enrollment)
    db.commit()

    # Mock LLM
    mock_llm = MagicMock()
    mock_structured = MagicMock()
    mock_llm.with_structured_output.return_value = mock_structured
    
    mock_output = QuizOutput(
        questions=[
            QuestionOutput(text="Q1", options=["A", "B", "C", "D"], correct_index=0),
            QuestionOutput(text="Q2", options=["A", "B", "C", "D"], correct_index=1),
            QuestionOutput(text="Q3", options=["A", "B", "C", "D"], correct_index=2),
            QuestionOutput(text="Q4", options=["A", "B", "C", "D"], correct_index=3),
            QuestionOutput(text="Q5", options=["A", "B", "C", "D"], correct_index=0),
        ]
    )
    mock_structured.invoke.return_value = mock_output
    
    with patch("app.routers.assessment.get_llm", return_value=mock_llm):
        response = client.get(f"/api/courses/{course.code}/baseline", headers={"Authorization": f"Bearer {token}"})
        
    assert response.status_code == 200
    data = response.json()
    assert "quiz_id" in data
    assert len(data["questions"]) == 5
    assert "correct_index" not in data["questions"][0]
    db.close()


def test_submit_baseline_quiz_success(monkeypatch: pytest.MonkeyPatch):
    token = _login(monkeypatch)
    db = SessionLocal()
    
    course = db.query(Course).filter(Course.code == "python").first()
    user = db.query(User).filter(User.email == "student@example.com").first()
    
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    quiz = BaselineQuiz(
        enrollment_id=enrollment.id,
        questions_json={
            "questions": [
                {"text": "Q1", "options": ["A", "B"], "correct_index": 0},
                {"text": "Q2", "options": ["A", "B"], "correct_index": 1}
            ]
        }
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    payload = {
        "quiz_id": quiz.id,
        "answers": [0, 1]
    }
    response = client.post(
        f"/api/courses/{course.code}/baseline", 
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 2
    assert data["total"] == 2
    
    db.refresh(enrollment)
    assert enrollment.baseline_score == 2
    assert enrollment.baseline_completed is True
    db.close()


def test_topic_assessment_updates_progress(monkeypatch: pytest.MonkeyPatch):
    token = _login(monkeypatch)
    db = SessionLocal()
    course = db.query(Course).filter(Course.code == "python").first()
    user = db.query(User).filter(User.email == "student@example.com").first()
    enrollment = Enrollment(user_id=user.id, course_id=course.id, baseline_completed=True)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    topic = course.topics[0]
    db.close()

    response = client.get(
        f"/api/courses/{course.code}/topics/{topic.id}/assessment",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    quiz = response.json()
    submit = client.post(
        f"/api/courses/{course.code}/topics/{topic.id}/assessment",
        json={"quiz_id": quiz["quiz_id"], "answers": [0, 1, 0, 0, 0]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit.status_code == 200
    assert submit.json() == {"score": 5, "total": 5}
