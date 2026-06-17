from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import Db
from app.models import Course, Enrollment, Lesson, LessonProgress
from app.schemas import CourseProgressOut, EnrollmentIn, EnrollmentOut, ProgressIn
from app.services.security import CurrentUser, require_roles
from app.services.serializers import enrollment_out


router = APIRouter(prefix="/enrollments", tags=["enrollments"])


def get_enrollment_or_404(db: Session, user_id: int, course_id: int) -> Enrollment:
    enrollment = db.scalar(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.get("", response_model=list[EnrollmentOut])
def list_enrollments(user: CurrentUser, db: Db) -> list[EnrollmentOut]:
    enrollments = db.scalars(select(Enrollment).where(Enrollment.user_id == user.id)).all()
    return [enrollment_out(e) for e in enrollments]


@router.post("", response_model=EnrollmentOut)
def enroll(payload: EnrollmentIn, user: CurrentUser, db: Db) -> EnrollmentOut:
    require_roles(user, "student")
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.status != "published":
        raise HTTPException(status_code=400, detail="Only published courses can be enrolled")
    existing = db.scalar(select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course.id))
    if existing:
        return enrollment_out(existing)
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    for lesson in course.lessons:
        db.add(LessonProgress(enrollment_id=enrollment.id, lesson_id=lesson.id))
    db.commit()
    db.refresh(enrollment)
    return enrollment_out(enrollment)


@router.get("/{course_id}/progress", response_model=CourseProgressOut)
def get_progress(course_id: int, user: CurrentUser, db: Db) -> CourseProgressOut:
    enrollment = get_enrollment_or_404(db, user.id, course_id)
    progress = db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment.id)).all()
    return CourseProgressOut(course_id=course_id, progress_percent=enrollment.progress_percent, lessons=progress)


@router.post("/{course_id}/lessons/{lesson_id}/progress")
def update_progress(course_id: int, lesson_id: int, payload: ProgressIn, user: CurrentUser, db: Db) -> dict[str, int | bool]:
    enrollment = get_enrollment_or_404(db, user.id, course_id)
    lesson = db.get(Lesson, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    progress = db.scalar(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment.id, LessonProgress.lesson_id == lesson_id))
    if not progress:
        progress = LessonProgress(enrollment_id=enrollment.id, lesson_id=lesson_id)
        db.add(progress)
    progress.watched_seconds = max(progress.watched_seconds, payload.watched_seconds)
    progress.completed = progress.watched_seconds >= max(1, int(lesson.duration_seconds * 0.9))
    progress.last_watched_at = datetime.utcnow()
    all_progress = db.scalars(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment.id)).all()
    completed_count = sum(1 for item in all_progress if item.completed or item.lesson_id == lesson_id and progress.completed)
    lesson_count = max(1, len(lesson.course.lessons))
    enrollment.progress_percent = round((completed_count / lesson_count) * 100)
    if enrollment.progress_percent >= 100:
        enrollment.completed_at = datetime.utcnow()
    db.commit()
    return {"progress_percent": enrollment.progress_percent, "completed": progress.completed}
