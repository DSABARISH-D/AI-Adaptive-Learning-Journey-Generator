"""Database seed helpers — run once at startup, not per-request."""

from __future__ import annotations

from app.database import SessionLocal
from app.models import Course, CourseTopic, Enrollment, StudentProfile, StudentTopicProgress, User


def seed_courses() -> None:
    """Insert starter courses and initial student data matching mockup if missing."""
    db = SessionLocal()
    try:
        catalog = [
            ("java", "Java Programming", "Build strong programming fundamentals with Java.", ["Basics", "Variables & Operators", "Conditional Statements", "Loops", "Methods", "OOP Concepts"]),
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
                db.add_all(
                    [
                        CourseTopic(course_id=course.id, title=topic, description=f"Practice {topic.lower()} through guided lessons.", order=index)
                        for index, topic in enumerate(topics, start=1)
                    ]
                )
            else:
                course.title = title
                course.summary = summary

        db.commit()

        # Seed default student user Sabarish D
        emails = ["sabarish@adaptivelearner.ai", "demo@adaptive-learner.dev"]
        for email in emails:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    full_name="Sabarish D",
                    avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                    google_sub="demo-sabarish-sub"
                )
                db.add(user)
                db.flush()
            else:
                user.full_name = "Sabarish D"
                user.avatar_url = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"

            # Create/update StudentProfile
            profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
            if not profile:
                profile = StudentProfile(
                    user_id=user.id,
                    preferred_name="Sabarish",
                    current_level="CSE Student",
                    interests=["Web Development", "Java", "AI"],
                    learning_goals=["Master Java Loops", "Full Stack Development"]
                )
                db.add(profile)
            else:
                profile.current_level = "CSE Student"

            # Enrollments for Java, Python, C++
            java_course = db.query(Course).filter(Course.code == "java").first()
            python_course = db.query(Course).filter(Course.code == "python").first()
            cpp_course = db.query(Course).filter(Course.code == "cpp").first()

            if java_course:
                java_enr = db.query(Enrollment).filter(Enrollment.user_id == user.id, Enrollment.course_id == java_course.id).first()
                if not java_enr:
                    java_enr = Enrollment(user_id=user.id, course_id=java_course.id, status="active", baseline_completed=True, baseline_score=72)
                    db.add(java_enr)
                    db.flush()
                    # Add topic progress
                    for t in java_course.topics:
                        p_score = 90 if "Basics" in t.title else (85 if "Variables" in t.title else (78 if "Conditional" in t.title else (42 if "Loops" in t.title else None)))
                        p_status = "completed" if p_score and p_score >= 70 else ("in_progress" if "Loops" in t.title else "upcoming")
                        db.add(StudentTopicProgress(
                            user_id=user.id,
                            enrollment_id=java_enr.id,
                            topic_id=t.id,
                            score=p_score,
                            status=p_status
                        ))

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

