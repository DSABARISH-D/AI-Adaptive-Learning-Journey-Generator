from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_db
from app.models import Course, CourseTopic, Enrollment, User
from app.schemas import CourseDetailOut, CourseOut, EnrollmentOut

router = APIRouter(prefix="/api", tags=["courses"])


def _seed_courses(db: Session) -> None:
    if db.query(Course).count() > 0:
        return

    python_course = Course(code="python", title="Python for Beginners", summary="Build a strong foundation in Python programming.")
    db.add(python_course)
    db.flush()

    db.add_all(
        [
            CourseTopic(course_id=python_course.id, title="Variables and Data Types", description="Learn the basics of Python values and variables.", order=1),
            CourseTopic(course_id=python_course.id, title="Control Flow", description="Use conditionals and loops to make decisions.", order=2),
            CourseTopic(course_id=python_course.id, title="Functions", description="Write reusable code with Python functions.", order=3),
        ]
    )

    sql_course = Course(code="sql", title="SQL Fundamentals", summary="Query and analyze relational data.")
    db.add(sql_course)
    db.flush()
    db.add_all(
        [
            CourseTopic(course_id=sql_course.id, title="SELECT Queries", description="Understand how data is retrieved from tables.", order=1),
            CourseTopic(course_id=sql_course.id, title="Joins", description="Combine data from multiple tables.", order=2),
        ]
    )

    db.commit()


@router.get("/courses", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)) -> list[Course]:
    _seed_courses(db)
    return db.query(Course).order_by(Course.id.asc()).all()


@router.get("/courses/{course_code}", response_model=CourseDetailOut)
def get_course(course_code: str, db: Session = Depends(get_db)) -> Course:
    _seed_courses(db)
    course = db.query(Course).filter(Course.code == course_code).first()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.post("/courses/{course_code}/enroll", response_model=EnrollmentOut)
def enroll_course(
    course_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Enrollment:
    _seed_courses(db)
    course = db.query(Course).filter(Course.code == course_code).first()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course.id)
        .first()
    )
    if existing is not None:
        return existing

    enrollment = Enrollment(user_id=current_user.id, course_id=course.id, status="active")
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/enrollments", response_model=list[EnrollmentOut])
def list_enrollments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Enrollment]:
    return (
        db.query(Enrollment)
        .join(Course)
        .filter(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
