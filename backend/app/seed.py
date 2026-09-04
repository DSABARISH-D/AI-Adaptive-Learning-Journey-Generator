"""Database seed helpers — run once at startup, not per-request."""

from __future__ import annotations

from app.database import SessionLocal
from app.models import Course, CourseTopic


def seed_courses() -> None:
    """Insert starter courses if the table is empty."""
    db = SessionLocal()
    try:
        if db.query(Course).count() > 0:
            return

        catalog = [
            ("java", "Java Programming", "Build object-oriented programming foundations.", ["Syntax and Types", "Control Flow", "Classes and Objects"]),
            ("python", "Python Programming", "Build a strong foundation in Python programming.", ["Variables and Data Types", "Control Flow", "Functions"]),
            ("c", "C Programming", "Understand low-level programming and memory.", ["Syntax and Pointers", "Memory Management", "Data Structures"]),
            ("cpp", "C++ Programming", "Learn modern C++ and object-oriented design.", ["C++ Basics", "Classes and Objects", "STL Fundamentals"]),
            ("sql", "SQL Fundamentals", "Query and analyze relational data.", ["SELECT Queries", "Joins", "Aggregation"]),
        ]
        for code, title, summary, topics in catalog:
            course = Course(code=code, title=title, summary=summary)
            db.add(course)
            db.flush()
            db.add_all(
                [
                    CourseTopic(course_id=course.id, title=topic, description=f"Practice {topic.lower()} through guided lessons.", order=index)
                    for index, topic in enumerate(topics, start=1)
                ]
            )

        db.commit()
    finally:
        db.close()
