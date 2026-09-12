from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    google_sub = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("StudentProfile", back_populates="user", uselist=False)
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), unique=True, nullable=False)
    preferred_name = Column(String, nullable=True)
    learning_goals = Column(JSON, nullable=True, default=list)
    interests = Column(JSON, nullable=True, default=list)
    current_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")

    __table_args__ = (UniqueConstraint("user_id", name="uq_student_profile_user"),)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    topics = relationship("CourseTopic", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")


class CourseTopic(Base):
    __tablename__ = "course_topics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(ForeignKey("courses.id"), nullable=False, index=True)
    code = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="topics")
    prerequisite_edges = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.topic_id",
        back_populates="topic",
        cascade="all, delete-orphan",
    )

    __table_args__ = (UniqueConstraint("course_id", "code", name="uq_course_topic_code"),)


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    course_id = Column(ForeignKey("courses.id"), nullable=False)
    status = Column(String, default="active", nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    baseline_score = Column(Integer, nullable=True)
    baseline_completed = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    baseline_quizzes = relationship("BaselineQuiz", back_populates="enrollment", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),)

    learning_plans = relationship("LearningPlan", back_populates="enrollment", cascade="all, delete-orphan")

    @property
    def course_code(self) -> str | None:
        return self.course.code if self.course else None

    @property
    def course_title(self) -> str | None:
        return self.course.title if self.course else None


class BaselineQuiz(Base):
    __tablename__ = "baseline_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=False)
    questions_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    enrollment = relationship("Enrollment", back_populates="baseline_quizzes")


class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(ForeignKey("course_topics.id"), nullable=False, index=True)
    prerequisite_topic_id = Column(ForeignKey("course_topics.id"), nullable=False, index=True)

    topic = relationship("CourseTopic", foreign_keys=[topic_id], back_populates="prerequisite_edges")
    prerequisite = relationship("CourseTopic", foreign_keys=[prerequisite_topic_id])

    __table_args__ = (UniqueConstraint("topic_id", "prerequisite_topic_id", name="uq_topic_prerequisite"),)


class TopicAssessment(Base):
    __tablename__ = "topic_assessments"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=False)
    topic_id = Column(ForeignKey("course_topics.id"), nullable=False)
    questions_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    topic = relationship("CourseTopic")


class StudentTopicProgress(Base):
    __tablename__ = "student_topic_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=False)
    topic_id = Column(ForeignKey("course_topics.id"), nullable=False)
    score = Column(Float, nullable=True)
    status = Column(String, default="NEEDS_REVISION", nullable=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    topic = relationship("CourseTopic")
    __table_args__ = (
        UniqueConstraint("enrollment_id", "topic_id", name="uq_progress_enrollment_topic"),
        UniqueConstraint("user_id", "topic_id", name="uq_mastery_user_topic"),
    )


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=False)
    assessment_type = Column(String, default="baseline", nullable=False)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(ForeignKey("assessment_attempts.id"), nullable=False, index=True)
    question_index = Column(Integer, nullable=False)
    topic_id = Column(ForeignKey("course_topics.id"), nullable=True, index=True)
    selected_index = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    earned_points = Column(Float, default=0, nullable=False)
    available_points = Column(Float, default=1, nullable=False)


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(ForeignKey("courses.id"), nullable=False, index=True)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=False, index=True)
    summary = Column(String, nullable=True)
    next_topic_id = Column(ForeignKey("course_topics.id"), nullable=True)
    agent_version = Column(String, default="learning-journey-v1", nullable=False)
    source = Column(String, default="fallback", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    enrollment = relationship("Enrollment", back_populates="learning_plans")
    nodes = relationship("LearningPlanNode", back_populates="plan", cascade="all, delete-orphan")


class LearningPlanNode(Base):
    __tablename__ = "learning_plan_nodes"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(ForeignKey("learning_plans.id"), nullable=False, index=True)
    topic_id = Column(ForeignKey("course_topics.id"), nullable=False, index=True)
    status = Column(String, nullable=False)
    mastery_score = Column(Float, nullable=True)
    reason = Column(String, nullable=True)
    estimated_minutes = Column(Integer, default=30, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    plan = relationship("LearningPlan", back_populates="nodes")
    topic = relationship("CourseTopic")


class AiRun(Base):
    __tablename__ = "ai_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(ForeignKey("courses.id"), nullable=True, index=True)
    task = Column(String, nullable=False)
    prompt_version = Column(String, default="learning-journey-v1", nullable=False)
    model_identifier = Column(String, nullable=True)
    status = Column(String, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    error_category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LearningActivity(Base):
    __tablename__ = "learning_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=True)
    activity_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    score = Column(Integer, nullable=True)
    minutes = Column(Integer, default=0, nullable=False)
    metadata_json = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
