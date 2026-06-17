import math

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from app.db.session import Db
from app.models import Course, Lesson
from app.schemas import CourseDetail, CourseIn, CourseOut, CoursePatch, LessonIn, LessonOut, LessonPatch, PaginatedCourses, RejectIn
from app.services.admin import delete_course as delete_course_with_dependents
from app.services.courses import make_slug
from app.services.security import CurrentUser, require_course_access, require_course_owner_or_admin, require_roles
from app.services.serializers import course_out, quiz_out


router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=PaginatedCourses)
def list_courses(
    db: Db,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
) -> PaginatedCourses:
    stmt = select(Course)
    if search:
        stmt = stmt.where(Course.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Course.status == status)
    else:
        stmt = stmt.where(Course.status == "published")
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    courses = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return PaginatedCourses(
        items=[course_out(c) for c in courses],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)) if total else 1,
    )


@router.post("", response_model=CourseOut)
def create_course(payload: CourseIn, user: CurrentUser, db: Db) -> CourseOut:
    require_roles(user, "instructor", "admin")
    slug = make_slug(payload.title)
    suffix = 2
    while db.scalar(select(Course).where(Course.slug == slug)):
        slug = f"{make_slug(payload.title)}-{suffix}"
        suffix += 1
    course = Course(
        title=payload.title,
        slug=slug,
        description=payload.description,
        price=payload.price,
        thumbnail_url=payload.thumbnail_url,
        instructor_id=user.id,
        status="draft",
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course_out(course)


@router.get("/slug/{slug}", response_model=CourseDetail)
def get_course_by_slug(slug: str, db: Db) -> CourseDetail:
    course = db.scalar(select(Course).where(Course.slug == slug, Course.status == "published"))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseDetail(**course_out(course).model_dump(), lessons=course.lessons, quizzes=[quiz_out(q) for q in course.quizzes])


@router.get("/{course_id}", response_model=CourseDetail)
def get_course(course_id: int, user: CurrentUser, db: Db) -> CourseDetail:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.status != "published":
        require_course_access(db, user, course)
    return CourseDetail(**course_out(course).model_dump(), lessons=course.lessons, quizzes=[quiz_out(q) for q in course.quizzes])


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, payload: CoursePatch, user: CurrentUser, db: Db) -> CourseOut:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, key, value)
    db.commit()
    db.refresh(course)
    return course_out(course)


@router.delete("/{course_id}")
def delete_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    return delete_course_with_dependents(db, course_id)


@router.post("/{course_id}/submit")
def submit_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    course.status = "pending"
    db.commit()
    return {"detail": "Course submitted for approval"}


@router.post("/{course_id}/archive")
def archive_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    course.status = "cancelled"
    db.commit()
    return {"detail": "Course archived"}


@router.post("/{course_id}/approve")
def approve_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.status = "published"
    db.commit()
    return {"detail": "Course approved"}


@router.post("/{course_id}/reject")
def reject_course(course_id: int, payload: RejectIn, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.status = "rejected"
    db.commit()
    return {"detail": f"Course rejected: {payload.reason}"}


@router.get("/{course_id}/lessons", response_model=list[LessonOut])
def list_lessons(course_id: int, user: CurrentUser, db: Db) -> list[Lesson]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_access(db, user, course)
    return list(db.scalars(select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)))


@router.post("/{course_id}/lessons", response_model=LessonOut)
def create_lesson(course_id: int, payload: LessonIn, user: CurrentUser, db: Db) -> Lesson:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    order = (db.scalar(select(func.max(Lesson.order)).where(Lesson.course_id == course_id)) or 0) + 1
    lesson = Lesson(course_id=course_id, order=order, **payload.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.patch("/{course_id}/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(course_id: int, lesson_id: int, payload: LessonPatch, user: CurrentUser, db: Db) -> Lesson:
    course = db.get(Course, course_id)
    lesson = db.get(Lesson, lesson_id)
    if not course or not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    require_course_owner_or_admin(user, course)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, key, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{course_id}/lessons/{lesson_id}")
def delete_lesson(course_id: int, lesson_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    course = db.get(Course, course_id)
    lesson = db.get(Lesson, lesson_id)
    if not course or not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    require_course_owner_or_admin(user, course)
    db.delete(lesson)
    db.commit()
    return {"detail": "Lesson deleted"}
