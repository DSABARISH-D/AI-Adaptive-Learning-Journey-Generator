"""Database seed helpers — run once at startup, not per-request."""

from __future__ import annotations

from app.database import SessionLocal
from app.models import Course, CourseTopic, Enrollment, StudentProfile, StudentTopicProgress, User
from app.services.graph_service import seed_linear_prerequisites, slugify_topic
from app.services.mastery_service import NEEDS_REVISION, mastery_status

JAVA_TOPICS = [
    "Basics",
    "Variables & Operators",
    "Conditional Statements",
    "Loops",
    "Methods",
    "OOP Concepts",
    "Exception Handling",
]


def seed_courses() -> None:
    """Insert starter courses, graphs, and initial student data if missing."""
    db = SessionLocal()
    try:
        catalog = [
            ("java", "Java Programming", "Build strong programming fundamentals with Java.", JAVA_TOPICS),
            ("python", "Python Programming", "Learn Python for application development and data science.", ["Variables & Data Types", "Control Flow", "Functions", "Data Structures", "OOP in Python"]),
            ("c", "C Programming", "Learn C programming from basics to advanced.", ["Syntax and Pointers", "Memory Management", "Data Structures", "File I/O"]),
            ("cpp", "C++ Programming", "Object-oriented programming with C++.", ["C++ Basics", "Classes and Objects", "STL Fundamentals", "Templates"]),
            ("sql", "SQL Fundamentals", "Learn SQL for database management and analysis.", ["SELECT Queries", "Joins", "Aggregation", "Indexes & Transactions"]),
            ("web-dev", "Web Development", "Build modern web applications (HTML, CSS, JavaScript).", ["HTML5 & Semantics", "CSS3 & Flexbox/Grid", "JavaScript Modern ES6", "DOM Manipulation", "REST APIs"]),
        ]

        for code, title, summary, topics in catalog:
            course = db.query(Course).filter(Course.code == code).first()
            if not course:
                course = Course(code=code, title=title, summary=summary)
                db.add(course)
                db.flush()
            else:
                course.title = title
                course.summary = summary

            existing_titles = {topic.title: topic for topic in course.topics}
            for index, topic_title in enumerate(topics, start=1):
                topic = existing_titles.get(topic_title)
                if topic is None:
                    topic = CourseTopic(
                        course_id=course.id,
                        code=slugify_topic(topic_title),
                        title=topic_title,
                        description=f"Practice {topic_title.lower()} through guided lessons.",
                        order=index,
                    )
                    db.add(topic)
                    db.flush()
                    existing_titles[topic_title] = topic
                else:
                    topic.code = topic.code or slugify_topic(topic_title)
                    topic.order = index
                    topic.description = topic.description or f"Practice {topic_title.lower()} through guided lessons."
            db.flush()
            persisted = db.query(CourseTopic).filter(CourseTopic.course_id == course.id).order_by(CourseTopic.order).all()
            seed_linear_prerequisites(db, persisted)

        db.commit()

        emails = ["sabarish@adaptivelearner.ai", "demo@adaptive-learner.dev"]
        for email in emails:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    full_name="Sabarish D",
                    avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                    google_sub="demo-sabarish-sub",
                )
                db.add(user)
                db.flush()
            else:
                user.full_name = "Sabarish D"
                user.avatar_url = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"

            profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
            if not profile:
                db.add(
                    StudentProfile(
                        user_id=user.id,
                        preferred_name="Sabarish",
                        current_level="CSE Student",
                        interests=["Web Development", "Java", "AI"],
                        learning_goals=["Master Java Loops", "Full Stack Development"],
                    )
                )
            else:
                profile.current_level = "CSE Student"

            java_course = db.query(Course).filter(Course.code == "java").first()
            python_course = db.query(Course).filter(Course.code == "python").first()
            cpp_course = db.query(Course).filter(Course.code == "cpp").first()

            if java_course:
                java_enr = db.query(Enrollment).filter(Enrollment.user_id == user.id, Enrollment.course_id == java_course.id).first()
                if not java_enr:
                    java_enr = Enrollment(
                        user_id=user.id,
                        course_id=java_course.id,
                        status="active",
                        baseline_completed=True,
                        baseline_score=72,
                    )
                    db.add(java_enr)
                    db.flush()
                    demo_scores = {
                        "Basics": 90,
                        "Variables & Operators": 85,
                        "Conditional Statements": 78,
                        "Loops": 42,
                    }
                    for topic in java_course.topics:
                        score = demo_scores.get(topic.title)
                        db.add(
                            StudentTopicProgress(
                                user_id=user.id,
                                enrollment_id=java_enr.id,
                                topic_id=topic.id,
                                score=score,
                                status=mastery_status(score) if score is not None else NEEDS_REVISION,
                            )
                        )

            if python_course:
                py_enr = db.query(Enrollment).filter(Enrollment.user_id == user.id, Enrollment.course_id == python_course.id).first()
                if not py_enr:
                    db.add(Enrollment(user_id=user.id, course_id=python_course.id, status="active", baseline_completed=True, baseline_score=45))

            if cpp_course:
                cpp_enr = db.query(Enrollment).filter(Enrollment.user_id == user.id, Enrollment.course_id == cpp_course.id).first()
                if not cpp_enr:
                    db.add(Enrollment(user_id=user.id, course_id=cpp_course.id, status="active", baseline_completed=True, baseline_score=38))

        db.commit()
    finally:
        db.close()
