import math

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.db.session import Db
from app.models import Course, Enrollment, LiveClass, User
from app.schemas import CourseOut, UserOut
from app.services.security import CurrentUser, require_roles
from app.services.serializers import course_out


router = APIRouter(prefix="/instructor", tags=["instructor"])


@router.get("/students")
def instructor_students(user: CurrentUser, db: Db, course_id: int | None = None, page: int = 1, page_size: int = 20) -> dict[str, object]:
    require_roles(user, "instructor", "admin")
    if course_id:
        course = db.get(Course, course_id)
        if not course or user.role == "instructor" and course.instructor_id != user.id:
            raise HTTPException(status_code=404, detail="Course not found")
        course_ids = [course_id]
    elif user.role == "admin":
        course_ids = list(db.scalars(select(Course.id)))
    else:
        course_ids = [c.id for c in db.scalars(select(Course).where(Course.instructor_id == user.id))]
    student_ids = [e.user_id for e in db.scalars(select(Enrollment).where(Enrollment.course_id.in_(course_ids))).all()] if course_ids else []
    stmt = select(User).where(User.id.in_(student_ids))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    users = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return {
        "items": [UserOut.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, math.ceil(total / page_size)) if total else 1,
    }


@router.get("/analytics")
def instructor_analytics(user: CurrentUser, db: Db) -> dict[str, int | float]:
    require_roles(user, "instructor", "admin")
    courses = db.scalars(select(Course) if user.role == "admin" else select(Course).where(Course.instructor_id == user.id)).all()
    course_ids = [c.id for c in courses]
    enrollments = db.scalars(select(Enrollment).where(Enrollment.course_id.in_(course_ids))).all() if course_ids else []
    completion_rate = round(sum(1 for e in enrollments if e.progress_percent >= 100) / max(1, len(enrollments)) * 100)
    live_sessions = db.scalar(select(func.count(LiveClass.id)).where(LiveClass.course_id.in_(course_ids))) if course_ids else 0
    return {
        "total_courses": len(courses),
        "total_students": len({e.user_id for e in enrollments}),
        "live_sessions": live_sessions or 0,
        "completion_rate": completion_rate,
    }


@router.get("/courses", response_model=list[CourseOut])
def instructor_courses(user: CurrentUser, db: Db) -> list[CourseOut]:
    require_roles(user, "instructor", "admin")
    courses = db.scalars(select(Course) if user.role == "admin" else select(Course).where(Course.instructor_id == user.id)).all()
    return [course_out(c) for c in courses]
