"""Practice API and execution regression tests."""

from fastapi.testclient import TestClient

from app.main import app
from services.ai_practice_service import evaluate_code_with_gemini, get_practice_questions


client = TestClient(app)


def test_practice_questions_are_available_for_supported_courses():
    for course in ("c", "cpp", "java", "python"):
        response = client.get(f"/api/courses/{course}/practice?level=1")
        assert response.status_code == 200
        assert response.json()["questions"]
        assert response.json()["questions"][0]["course"] == course


def test_custom_runner_executes_code():
    response = client.post(
        "/api/practice/run",
        json={"code": "print(123)", "language": "python", "input": ""},
    )

    assert response.status_code == 200
    assert response.json() == {"ok": True, "output": "123", "error": None}


def test_submission_uses_real_output_for_pass_fail():
    question = get_practice_questions("python", 1)[0]
    code = (
        "import sys\n"
        "value = ''.join(sys.stdin.read().strip().lower().split())\n"
        "print('YES' if value == value[::-1] else 'NO')\n"
    )

    result = evaluate_code_with_gemini(code, "python", question)

    assert result["allPassed"] is True
    assert result["score"] == 100