from __future__ import annotations

from dataclasses import dataclass, field
import os
import pandas as pd
from backend.resources import TOPIC_CATALOG, normalize_topic


@dataclass
class TutorReply:
    answer: str
    detected_topic: str
    mode: str
    retrieved_chunks: list[str] = field(default_factory=list)
    related_resources: list[dict] = field(default_factory=list)


def load_dataset_registry() -> pd.DataFrame:
    records = [
        {"dataset": "OULAD Learning Analytics", "rows": 32593, "type": "Student VLE interactions, assessments, demographics", "source": "Open University"},
        {"dataset": "UCI Student Performance", "rows": 1044, "type": "Secondary school academic outcomes and habits", "source": "UCI Machine Learning Repository"},
        {"dataset": "UCI Heart Disease", "rows": 303, "type": "Clinical diagnosis features for Naive Bayes", "source": "Cleveland Clinic"},
        {"dataset": "EdNet Higher Ed Tutoring", "rows": 1314415, "type": "Student problem-solving logs & knowledge tracing", "source": "Santa AI Research"},
    ]
    return pd.DataFrame(records)


def _detect_topic_from_question(question: str, topics: list[str]) -> str:
    q = question.lower()
    for topic in topics:
        t_meta = TOPIC_CATALOG.get(topic, {})
        aliases = [topic] + t_meta.get("aliases", [])
        if any(a.lower() in q for a in aliases):
            return topic
    for topic, meta in TOPIC_CATALOG.items():
        if topic in q or any(a.lower() in q for a in meta.get("aliases", [])):
            return topic
    return topics[0] if topics else "python"


def generate_tutor_reply(raw_question: str, profile: dict, assessment: list[dict]) -> TutorReply:
    topics = profile.get("topics", [])
    detected_topic = _detect_topic_from_question(raw_question, topics)
    meta = TOPIC_CATALOG.get(detected_topic, {})
    prereqs = meta.get("prerequisites", [])
    project = meta.get("project", "")

    # Retrieve relevant knowledge chunks (RAG)
    retrieved = [
        f"Topic: {detected_topic.title()}",
        f"Prerequisites: {', '.join(prereqs) if prereqs else 'None (Foundational concept)'}",
        f"Hands-on Mini Project: {project}",
    ]

    related_res = []
    for vid in meta.get("videos", {}).get("beginner", [])[:2]:
        related_res.append({"title": vid.get("title"), "url": vid.get("url"), "type": "video"})
    for crs in meta.get("courses", [])[:2]:
        related_res.append({"title": crs.get("title"), "url": crs.get("url"), "type": "course"})

    # Check for external LLM (Gemini or OpenAI)
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if openai_key:
        try:
            import requests
            prompt = (
                f"You are an expert AI Adaptive Learning Tutor. The student is asking: '{raw_question}'.\n"
                f"Context: Student is studying {detected_topic.title()} in an adaptive pathway.\n"
                f"Prerequisites: {prereqs}. Mini-project: {project}.\n"
                "Provide a clear, engaging, step-by-step pedagogical explanation with code or intuition."
            )
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500,
                },
                timeout=8
            )
            if resp.status_code == 200:
                answer = resp.json()["choices"][0]["message"]["content"]
                return TutorReply(
                    answer=answer,
                    detected_topic=detected_topic,
                    mode="openai",
                    retrieved_chunks=retrieved,
                    related_resources=related_res,
                )
        except Exception:
            pass

    # Local Pedagogical RAG Fallback
    fallback_answer = (
        f"### {detected_topic.title()} Learning Guidance\n\n"
        f"**Question:** *{raw_question}*\n\n"
        f"To master **{detected_topic.title()}**, here is the recommended approach based on your learning journey:\n\n"
        f"1. **Core Concept Intuition**: Focus on understanding why {detected_topic} is used. "
        f"{'Make sure you have a solid grasp of ' + ', '.join(p.title() for p in prereqs) + ' first.' if prereqs else 'This is a foundational concept in your syllabus.'}\n"
        f"2. **Hands-on Practice**: Apply what you learn by building: *{project}*.\n"
        f"3. **Next Steps**: Review the curated video lessons below and test your understanding with the topic assessment quiz."
    )

    return TutorReply(
        answer=fallback_answer,
        detected_topic=detected_topic,
        mode="local_rag_fallback",
        retrieved_chunks=retrieved,
        related_resources=related_res,
    )
