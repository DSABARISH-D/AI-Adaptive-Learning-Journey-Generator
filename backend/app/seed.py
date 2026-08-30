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

        python_course = Course(
            code="python",
            title="Python for Beginners",
            summary="Build a strong foundation in Python programming.",
        )
        db.add(python_course)
        db.flush()
        db.add_all(
            [
                CourseTopic(course_id=python_course.id, title="Variables and Data Types", description="Learn the basics of Python values and variables.", order=1),
                CourseTopic(course_id=python_course.id, title="Control Flow", description="Use conditionals and loops to make decisions.", order=2),
                CourseTopic(course_id=python_course.id, title="Functions", description="Write reusable code with Python functions.", order=3),
            ]
        )

        sql_course = Course(
            code="sql",
            title="SQL Fundamentals",
            summary="Query and analyze relational data.",
        )
        db.add(sql_course)
        db.flush()
        db.add_all(
            [
                CourseTopic(course_id=sql_course.id, title="SELECT Queries", description="Understand how data is retrieved from tables.", order=1),
                CourseTopic(course_id=sql_course.id, title="Joins", description="Combine data from multiple tables.", order=2),
            ]
        )

        db.commit()
    finally:
        db.close()
