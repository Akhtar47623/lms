import math

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import (
    Certificate,
    Assignment,
    AssignmentSubmission,
    Course,
    CourseCategory,
    Enrollment,
    Lesson,
    LessonProgress,
    LiveClass,
    Notification,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    Role,
    PlatformSetting,
    User,
    UserRole,
)
from app.repositories.users import assign_role
from app.schemas import (
    AdminEnrollmentCourseOut,
    AdminUserOut,
    CourseOut,
    EnrollmentOut,
    PlatformReportOut,
    PlatformSettingIn,
    PaginatedAdminUsers,
    UserPatch,
)
from app.services.serializers import course_out, enrollment_out


def list_users(
    db: Session,
    *,
    page: int,
    page_size: int,
    role: str | None = None,
    search: str | None = None,
) -> PaginatedAdminUsers:
    stmt = select(User)
    if role:
        stmt = stmt.join(UserRole).join(Role).where(Role.name == role.upper())
    if search:
        stmt = stmt.where(User.email.ilike(f"%{search}%"))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    users = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return PaginatedAdminUsers(
        items=[admin_user_out(db, user) for user in users],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)) if total else 1,
    )


def admin_user_out(db: Session, user: User) -> AdminUserOut:
    enrollments = db.scalars(select(Enrollment).where(Enrollment.user_id == user.id)).all()
    return AdminUserOut(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        enrolled_courses=[
            AdminEnrollmentCourseOut(
                course_id=enrollment.course_id,
                course_title=enrollment.course.title,
                progress_percent=enrollment.progress_percent,
                enrolled_at=enrollment.enrolled_at,
                completed_at=enrollment.completed_at,
            )
            for enrollment in enrollments
        ],
    )


def update_user(db: Session, user_id: int, payload: UserPatch) -> User:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    role_name = data.pop("role", None)
    for field, value in data.items():
        setattr(target, field, value)
    if role_name:
        assign_role(db, target, role_name)
    db.commit()
    db.refresh(target)
    return target


def delete_user(db: Session, user_id: int) -> dict[str, str]:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    owned_course_ids = db.scalars(select(Course.id).where(Course.instructor_id == user_id)).all()
    for course_id in owned_course_ids:
        delete_course(db, course_id)

    enrollment_ids = db.scalars(select(Enrollment.id).where(Enrollment.user_id == user_id)).all()
    if enrollment_ids:
        db.execute(delete(LessonProgress).where(LessonProgress.enrollment_id.in_(enrollment_ids)))
    db.execute(delete(Enrollment).where(Enrollment.user_id == user_id))
    db.execute(delete(QuizAttempt).where(QuizAttempt.user_id == user_id))
    db.execute(delete(Certificate).where(Certificate.user_id == user_id))
    db.execute(delete(Notification).where(Notification.user_id == user_id))
    db.execute(delete(UserRole).where(UserRole.user_id == user_id))
    db.delete(target)
    db.commit()
    return {"detail": "User deleted"}


def list_courses(db: Session, status: str | None = None) -> list[CourseOut]:
    stmt = select(Course)
    if status and status != "all":
        stmt = stmt.where(Course.status == status)
    courses = db.scalars(stmt.order_by(Course.created_at.desc())).all()
    return [course_out(course) for course in courses]


def list_enrollments(db: Session, course_id: int | None = None, user_id: int | None = None) -> list[EnrollmentOut]:
    stmt = select(Enrollment)
    if course_id:
        stmt = stmt.where(Enrollment.course_id == course_id)
    if user_id:
        stmt = stmt.where(Enrollment.user_id == user_id)
    enrollments = db.scalars(stmt.order_by(Enrollment.enrolled_at.desc())).all()
    return [enrollment_out(enrollment) for enrollment in enrollments]


def approve_course(db: Session, course_id: int) -> dict[str, str]:
    course = get_course_or_404(db, course_id)
    course.status = "published"
    db.commit()
    return {"detail": "Course approved"}


def cancel_course(db: Session, course_id: int) -> dict[str, str]:
    course = get_course_or_404(db, course_id)
    course.status = "cancelled"
    db.commit()
    return {"detail": "Course cancelled"}


def pending_course(db: Session, course_id: int) -> dict[str, str]:
    course = get_course_or_404(db, course_id)
    course.status = "pending"
    db.commit()
    return {"detail": "Course moved to pending"}


def delete_course(db: Session, course_id: int) -> dict[str, str]:
    course = get_course_or_404(db, course_id)
    lesson_ids = db.scalars(select(Lesson.id).where(Lesson.course_id == course_id)).all()
    quiz_ids = db.scalars(select(Quiz.id).where(Quiz.course_id == course_id)).all()
    enrollment_ids = db.scalars(select(Enrollment.id).where(Enrollment.course_id == course_id)).all()

    if enrollment_ids:
        db.execute(delete(LessonProgress).where(LessonProgress.enrollment_id.in_(enrollment_ids)))
    if lesson_ids:
        db.execute(delete(LessonProgress).where(LessonProgress.lesson_id.in_(lesson_ids)))
    if quiz_ids:
        db.execute(delete(QuizAttempt).where(QuizAttempt.quiz_id.in_(quiz_ids)))
        db.execute(delete(QuizQuestion).where(QuizQuestion.quiz_id.in_(quiz_ids)))

    assignment_ids = db.scalars(select(Assignment.id).where(Assignment.course_id == course_id)).all()
    if assignment_ids:
        db.execute(delete(AssignmentSubmission).where(AssignmentSubmission.assignment_id.in_(assignment_ids)))

    db.execute(delete(Certificate).where(Certificate.course_id == course_id))
    db.execute(delete(LiveClass).where(LiveClass.course_id == course_id))
    db.execute(delete(Enrollment).where(Enrollment.course_id == course_id))
    db.execute(delete(Lesson).where(Lesson.course_id == course_id))
    db.execute(delete(Quiz).where(Quiz.course_id == course_id))
    db.execute(delete(Assignment).where(Assignment.course_id == course_id))
    db.delete(course)
    db.commit()
    return {"detail": "Course deleted"}


def stats(db: Session) -> dict[str, int | float]:
    return {
        "total_users": db.scalar(select(func.count(User.id))) or 0,
        "active_courses": db.scalar(select(func.count(Course.id)).where(Course.status == "published")) or 0,
        "certificates_issued": db.scalar(select(func.count(Certificate.id))) or 0,
        "growth_percent": 12.5,
    }


def platform_report(db: Session) -> PlatformReportOut:
    student_role_id = db.scalar(select(Role.id).where(Role.name == "STUDENT"))
    instructor_role_id = db.scalar(select(Role.id).where(Role.name == "INSTRUCTOR"))
    return PlatformReportOut(
        total_users=db.scalar(select(func.count(User.id))) or 0,
        active_students=db.scalar(
            select(func.count(User.id)).join(UserRole).where(User.is_active.is_(True), UserRole.role_id == student_role_id)
        )
        or 0,
        active_instructors=db.scalar(
            select(func.count(User.id)).join(UserRole).where(User.is_active.is_(True), UserRole.role_id == instructor_role_id)
        )
        or 0,
        total_courses=db.scalar(select(func.count(Course.id))) or 0,
        published_courses=db.scalar(select(func.count(Course.id)).where(Course.status == "published")) or 0,
        pending_courses=db.scalar(select(func.count(Course.id)).where(Course.status == "pending")) or 0,
        total_enrollments=db.scalar(select(func.count(Enrollment.id))) or 0,
        completed_enrollments=db.scalar(select(func.count(Enrollment.id)).where(Enrollment.completed_at.is_not(None))) or 0,
        live_classes=db.scalar(select(func.count(LiveClass.id))) or 0,
        certificates_issued=db.scalar(select(func.count(Certificate.id))) or 0,
        quiz_attempts=db.scalar(select(func.count(QuizAttempt.id))) or 0,
        assignment_submissions=db.scalar(select(func.count(AssignmentSubmission.id))) or 0,
    )


def list_categories(db: Session) -> list[CourseCategory]:
    return list(db.scalars(select(CourseCategory).order_by(CourseCategory.name)))


def list_settings(db: Session) -> list[PlatformSetting]:
    return list(db.scalars(select(PlatformSetting).order_by(PlatformSetting.key)))


def upsert_setting(db: Session, payload: PlatformSettingIn) -> PlatformSetting:
    setting = db.scalar(select(PlatformSetting).where(PlatformSetting.key == payload.key))
    if setting:
        setting.value = payload.value
    else:
        setting = PlatformSetting(key=payload.key, value=payload.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def get_course_or_404(db: Session, course_id: int) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
