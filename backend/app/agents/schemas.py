from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

NodeStatus = Literal["RECOMMENDED", "REVISION", "LOCKED", "MASTERED"]


class ResourceQuery(BaseModel):
    topic_id: str
    language: str = "en"
    query: str


class QuizBlueprint(BaseModel):
    count: int = Field(ge=1, le=20, default=5)
    difficulty: str = "beginner"


class CodingBlueprint(BaseModel):
    count: int = Field(ge=0, le=10, default=2)
    difficulty: str = "beginner"


class JourneyNode(BaseModel):
    topic_id: str
    status: NodeStatus
    mastery_score: float | None = None
    difficulty: str = "beginner"
    prerequisites: list[str] = Field(default_factory=list)
    reason: str
    estimated_minutes: int = Field(ge=5, le=240, default=45)


class LearningJourneyOutput(BaseModel):
    course_id: str
    summary: str
    nodes: list[JourneyNode]
    next_topic: str
    revision_topics: list[str] = Field(default_factory=list)
    resource_queries: list[ResourceQuery] = Field(default_factory=list)
    notes_outline: list[str] = Field(default_factory=list)
    quiz_blueprint: QuizBlueprint = Field(default_factory=QuizBlueprint)
    coding_blueprint: CodingBlueprint = Field(default_factory=CodingBlueprint)
