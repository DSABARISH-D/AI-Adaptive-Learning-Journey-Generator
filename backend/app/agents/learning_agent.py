"""Learning Journey Agent: structured planning inside a validated schema.

Strands Agents is used when the SDK is installed; otherwise the same prompt/schema
contract runs through the existing LLM adapter or a deterministic fallback.
"""

from __future__ import annotations

import time
from typing import Any

from sqlalchemy.orm import Session

from app.agents.prompts import PROMPT_VERSION, build_planner_prompt
from app.agents.schemas import JourneyNode, LearningJourneyOutput, ResourceQuery
from app.agents.tools import constrained_eligible_codes, get_learner_snapshot, get_question_stats, get_topic_graph
from app.config import settings
from app.models import AiRun, Course
from app.services.mastery_service import is_mastered

AGENT_VERSION = "learning-journey-v1"


def _record_run(
    db: Session,
    *,
    user_id: int,
    course_id: int,
    status: str,
    latency_ms: int,
    model_identifier: str,
    error_category: str | None = None,
) -> None:
    db.add(
        AiRun(
            user_id=user_id,
            course_id=course_id,
            task="generate_learning_plan",
            prompt_version=PROMPT_VERSION,
            model_identifier=model_identifier,
            status=status,
            latency_ms=latency_ms,
            error_category=error_category,
        )
    )


def fallback_plan(context: dict[str, Any]) -> LearningJourneyOutput:
    snapshot = context["snapshot"]
    graph = context["graph"]
    eligible = set(context["eligible"])
    stats = context["stats"]
    by_code = {node["topic_id"]: node for node in graph["nodes"]}
    edges = {item["topic_id"]: item["prerequisites"] for item in graph["edges"]}
    progress = {item["topic_id"]: item for item in snapshot["topics"]}

    next_topic = next(
        (code for code in (node["topic_id"] for node in graph["nodes"]) if code in eligible and not is_mastered(progress.get(code, {}).get("score"))),
        graph["nodes"][0]["topic_id"] if graph["nodes"] else "basics",
    )
    nodes: list[JourneyNode] = []
    for node in graph["nodes"]:
        code = node["topic_id"]
        score = progress.get(code, {}).get("score")
        mastered = is_mastered(score)
        if mastered:
            status = "MASTERED"
            reason = "Backend mastery threshold met."
        elif code not in eligible:
            status = "LOCKED"
            reason = "A prerequisite is below the mastery threshold."
        elif code == next_topic:
            status = "REVISION" if code in stats["weak"] else "RECOMMENDED"
            reason = "Next eligible topic after prerequisite repair."
        else:
            status = "LOCKED"
            reason = "Complete the current eligible topic first."
        nodes.append(
            JourneyNode(
                topic_id=code,
                status=status,
                mastery_score=score,
                prerequisites=edges.get(code, []),
                reason=reason,
                estimated_minutes=45 if status in {"RECOMMENDED", "REVISION"} else 20,
            )
        )
    revision = [code for code in stats["weak"] if code in eligible or code == next_topic]
    title = by_code.get(next_topic, {}).get("title", next_topic)
    return LearningJourneyOutput(
        course_id=snapshot["course_id"],
        summary=f"Focus on {title}. Backend scores and prerequisites control unlocking.",
        nodes=nodes,
        next_topic=next_topic,
        revision_topics=revision,
        resource_queries=[ResourceQuery(topic_id=next_topic, language="en", query=f"{title} beginner")],
        notes_outline=[title, "Worked example", "Common mistakes"],
    )


def _try_strands(prompt: str) -> LearningJourneyOutput | None:
    try:
        from strands import Agent  # type: ignore
        from strands.models import BedrockModel  # type: ignore
    except Exception:
        return None
    try:
        model_id = getattr(settings, "bedrock_model_id", "") or "us.anthropic.claude-sonnet-4-20250514-v1:0"
        agent = Agent(model=BedrockModel(model_id=model_id), name="learning-journey")
        result = agent.structured_output(LearningJourneyOutput, prompt)
        if isinstance(result, LearningJourneyOutput):
            return result
        return LearningJourneyOutput.model_validate(result)
    except Exception:
        return None


def _try_llm(prompt: str) -> LearningJourneyOutput | None:
    from app.services.llm import get_llm

    llm = get_llm()
    structured = llm.with_structured_output(LearningJourneyOutput)
    try:
        result = structured.invoke(prompt)
    except Exception:
        return None
    if isinstance(result, LearningJourneyOutput):
        return result
    try:
        return LearningJourneyOutput.model_validate(result.model_dump() if hasattr(result, "model_dump") else result)
    except Exception:
        return None


def plan_learning_journey(
    db: Session,
    *,
    user_id: int,
    course: Course,
    enrollment_id: int,
) -> tuple[LearningJourneyOutput, str]:
    started = time.perf_counter()
    snapshot = get_learner_snapshot(db, user_id, course, enrollment_id)
    graph = get_topic_graph(db, course.id)
    stats = get_question_stats(snapshot)
    eligible = constrained_eligible_codes(db, course, enrollment_id)
    context = {"snapshot": snapshot, "graph": graph, "stats": stats, "eligible": eligible}
    prompt = build_planner_prompt(context)

    source = "fallback"
    output = _try_strands(prompt)
    model_identifier = "strands" if output is not None else settings.llm_provider
    if output is not None:
        source = "strands"
    else:
        output = _try_llm(prompt)
        if output is not None:
            source = "llm"
        else:
            output = fallback_plan(context)
            model_identifier = "deterministic-fallback"

    latency_ms = int((time.perf_counter() - started) * 1000)
    _record_run(
        db,
        user_id=user_id,
        course_id=course.id,
        status="ok" if source != "fallback" else "fallback",
        latency_ms=latency_ms,
        model_identifier=model_identifier,
        error_category=None if source != "fallback" else "model_unavailable_or_invalid",
    )
    return output, source
