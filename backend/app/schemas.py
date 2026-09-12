from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Error response (consistent shape across the API)
# ---------------------------------------------------------------------------
class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    preferred_name: str | None = None
    learning_goals: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    current_level: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    preferred_name: str | None = None
    learning_goals: list[str] | None = None
    interests: list[str] | None = None
    current_level: str | None = None


class AuthTokenResponse(BaseModel):
    token: str
    user: UserOut


class CourseTopicOut(BaseModel):
    id: int
    code: str
    title: str
    description: str | None = None
    order: int

    model_config = ConfigDict(from_attributes=True)


class CourseOut(BaseModel):
    id: int
    code: str
    title: str
    summary: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CourseDetailOut(BaseModel):
    id: int
    code: str
    title: str
    summary: str | None = None
    topics: list[CourseTopicOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class EnrollmentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    course_code: str | None = None
    course_title: str | None = None
    status: str
    enrolled_at: datetime
    baseline_score: int | None = None
    baseline_completed: bool = False

    model_config = ConfigDict(from_attributes=True)
