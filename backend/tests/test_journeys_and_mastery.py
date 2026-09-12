"""Critical test cases for Mastery engine, Topic Prerequisite graph, Journey generator, and AI safety boundaries."""

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Course, Enrollment, StudentTopicProgress, User
from app.agents.schemas import JourneyNode, LearningJourneyOutput, ResourceQuery
from app.services.journey_service import validate_plan
from app.services.mastery_service import is_mastered, mastery_status, MASTERED, NEEDS_REVISION
from app.services.graph_service import eligible_topic_ids, load_edges, load_topics

client = TestClient(app)


def _get_auth_token() -> str:
    """Obtain test token via dev-login."""
    response = client.post("/api/auth/dev-login")
    assert response.status_code == 200
    return response.json()["token"]


# ---------------------------------------------------------------------------
# Mastery Engine Tests: MAST-01, MAST-02, MAST-03
# ---------------------------------------------------------------------------
def test_mast_01_boundary_below_threshold():
    """MAST-01: 69.99% must evaluate to NEEDS_REVISION."""
    score = 69.99
    assert is_mastered(score) is False
    assert mastery_status(score) == NEEDS_REVISION


def test_mast_02_boundary_at_threshold():
    """MAST-02: 70.00% must evaluate to MASTERED."""
    score = 70.00
    assert is_mastered(score) is True
    assert mastery_status(score) == MASTERED


def test_mast_03_prerequisite_locking():
    """MAST-03: Dependent topic is blocked/locked if its prerequisite is below mastery."""
    db = SessionLocal()
    try:
        course = db.query(Course).filter(Course.code == "java").first()
        topics = load_topics(db, course.id)
        topic_ids = [t.id for t in topics]
        edges = load_edges(db, topic_ids)

        # Basics (id 1) -> Variables (id 2) -> Conditionals (id 3)
        basics_id = topics[0].id
        variables_id = topics[1].id

        # If Basics has score 65.0 (unmastered), Variables must NOT be eligible
        scores = {basics_id: 65.0}
        eligible = eligible_topic_ids(topics, edges, scores)
        assert basics_id in eligible
        assert variables_id not in eligible

        # Once Basics has 70.0 (mastered), Variables becomes eligible
        scores[basics_id] = 70.0
        eligible_after = eligible_topic_ids(topics, edges, scores)
        assert variables_id in eligible_after
    finally:
        db.close()


# ---------------------------------------------------------------------------
# AI Agent & Validator Tests: AI-01, AI-02, AI-03, AI-04
# ---------------------------------------------------------------------------
def test_ai_01_valid_output_accepted():
    """AI-01: Valid output meeting schema and graph constraints is accepted."""
    db = SessionLocal()
    try:
        course = db.query(Course).filter(Course.code == "java").first()
        topics = load_topics(db, course.id)
        edges = load_edges(db, [t.id for t in topics])
        scores = {topics[0].id: 85.0}

        valid_raw = LearningJourneyOutput(
            course_id="java",
            summary="Focus on variables and operators.",
            nodes=[
                JourneyNode(
                    topic_id=topics[0].code,
                    status="RECOMMENDED",
                    mastery_score=85.0,
                    prerequisites=[],
                    reason="Already mastered",
                ),
                JourneyNode(
                    topic_id=topics[1].code,
                    status="RECOMMENDED",
                    mastery_score=None,
                    prerequisites=[topics[0].code],
                    reason="Next eligible step",
                ),
            ],
            next_topic=topics[1].code,
            revision_topics=[],
            resource_queries=[ResourceQuery(topic_id=topics[1].code, language="en", query="Java Variables")],
            notes_outline=["Variables", "Primitive Types"],
        )

        validated = validate_plan(valid_raw, course, topics, edges, scores)
        assert validated.course_id == "java"
        assert validated.next_topic == topics[1].code
        # Backend mastery is authoritative: topics[0] had 85.0, so validator sets it to MASTERED
        node_0 = next(n for n in validated.nodes if n.topic_id == topics[0].code)
        assert node_0.status == "MASTERED"
    finally:
        db.close()


def test_ai_02_unknown_topic_rejected():
    """AI-02: Output referencing an invented topic_id is rejected by validate_plan."""
    db = SessionLocal()
    try:
        course = db.query(Course).filter(Course.code == "java").first()
        topics = load_topics(db, course.id)
        edges = load_edges(db, [t.id for t in topics])
        scores = {}

        invalid_raw = LearningJourneyOutput(
            course_id="java",
            summary="Invalid topic test",
            nodes=[
                JourneyNode(
                    topic_id="invented_quantum_java",
                    status="RECOMMENDED",
                    mastery_score=None,
                    prerequisites=[],
                    reason="Hallucinated topic",
                )
            ],
            next_topic="invented_quantum_java",
        )

        with pytest.raises(ValueError, match="unknown"):
            validate_plan(invalid_raw, course, topics, edges, scores)
    finally:
        db.close()


def test_ai_03_fake_url_rejected():
    """AI-03: Model attempting to output fake URL directly in query is rejected."""
    db = SessionLocal()
    try:
        course = db.query(Course).filter(Course.code == "java").first()
        topics = load_topics(db, course.id)
        edges = load_edges(db, [t.id for t in topics])
        scores = {}

        fake_url_raw = LearningJourneyOutput(
            course_id="java",
            summary="Fake url test",
            nodes=[],
            next_topic=topics[0].code,
            resource_queries=[ResourceQuery(topic_id=topics[0].code, query="https://fake-hallucinated-site.com/java")],
        )

        with pytest.raises(ValueError, match="fabricated resource URL"):
            validate_plan(fake_url_raw, course, topics, edges, scores)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# API Contract Endpoints Tests: Journey, Resources, Tutor
# ---------------------------------------------------------------------------
def test_journey_endpoints_flow():
    """Test full journey endpoint flow: current journey, generate journey, and mastery map."""
    token = _get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch current journey for java
    res_current = client.get("/api/courses/java/journey", headers=headers)
    assert res_current.status_code == 200
    data = res_current.json()
    assert "course" in data
    assert "topics" in data
    assert "currentTopic" in data

    # 2. Generate journey
    res_gen = client.post("/api/journeys/generate", json={"course_code": "java"}, headers=headers)
    assert res_gen.status_code == 200
    gen_data = res_gen.json()
    assert gen_data["course"]["code"] == "java"
    assert "topics" in gen_data
    assert "plan" in gen_data

    # 3. Get mastery summary
    res_mastery = client.get("/api/me/mastery?course_code=java", headers=headers)
    assert res_mastery.status_code == 200
    mastery_data = res_mastery.json()
    assert mastery_data["course_code"] == "java"
    assert mastery_data["threshold"] == 70.0
    assert len(mastery_data["topics"]) > 0


def test_resources_endpoint_en_and_tamil():
    """Test resources endpoint returns validated resources in English and Tamil."""
    # English resources
    res_en = client.get("/api/resources?course_code=java&language=en")
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["language"] == "en"
    assert len(data_en["videos"]) > 0
    assert all("youtube.com" in v["url"] for v in data_en["videos"])

    # Tamil resources
    res_ta = client.get("/api/resources?course_code=java&language=ta")
    assert res_ta.status_code == 200
    data_ta = res_ta.json()
    assert data_ta["language"] == "ta"
    assert len(data_ta["videos"]) > 0
    assert any("Tamil" in v["title"] for v in data_ta["videos"])


def test_tutor_endpoint_message():
    """Test tutor message endpoint produces grounded pedagogical guidance."""
    token = _get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "message": "Why do we need loops in Java?",
        "course_code": "java",
        "topic": "Loops",
        "level": "beginner",
    }
    response = client.post("/api/tutor/messages", json=payload, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "reply" in body
    assert len(body["reply"]) > 20
    assert "detected_topic" in body
    assert len(body["retrieved_chunks"]) > 0
