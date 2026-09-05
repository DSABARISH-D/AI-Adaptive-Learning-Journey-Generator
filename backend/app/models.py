from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
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
    course_id = Column(ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="topics")


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
    score = Column(Integer, nullable=True)
    status = Column(String, default="upcoming", nullable=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    topic = relationship("CourseTopic")
    __table_args__ = (UniqueConstraint("enrollment_id", "topic_id", name="uq_progress_enrollment_topic"),)


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(ForeignKey("enrollments.id"), nullable=False)
    assessment_type = Column(String, default="baseline", nullable=False)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
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
