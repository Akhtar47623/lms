from sqlalchemy.orm import Session

from app.models import Certificate, Course, Enrollment, LiveClass, Quiz, User
from app.schemas import CertificateOut, CourseOut, EnrollmentOut, LiveClassOut, QuizOut


def user_name(user: User | None) -> str | None:
    return f"{user.first_name} {user.last_name}" if user else None


def course_out(course: Course) -> CourseOut:
    return CourseOut(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        thumbnail_url=course.thumbnail_url,
        instructor_id=course.instructor_id,
        instructor_name=user_name(course.instructor),
        status=course.status,
        price=course.price,
        lesson_count=len(course.lessons),
        enrollment_count=len(course.enrollments),
        created_at=course.created_at,
    )


def quiz_out(quiz: Quiz) -> QuizOut:
    return QuizOut(
        id=quiz.id,
        course_id=quiz.course_id,
        title=quiz.title,
        passing_score=quiz.passing_score,
        question_count=len(quiz.questions),
    )


def enrollment_out(enrollment: Enrollment) -> EnrollmentOut:
    return EnrollmentOut(
        id=enrollment.id,
        course_id=enrollment.course_id,
        course_title=enrollment.course.title,
        progress_percent=enrollment.progress_percent,
        enrolled_at=enrollment.enrolled_at,
        completed_at=enrollment.completed_at,
    )


def certificate_out(certificate: Certificate, db: Session) -> CertificateOut:
    course = db.get(Course, certificate.course_id)
    return CertificateOut(
        id=certificate.id,
        course_id=certificate.course_id,
        course_title=course.title if course else "Course",
        issued_at=certificate.issued_at,
        download_url=f"/api/v1/certificates/{certificate.id}/download",
    )


def live_class_out(item: LiveClass, db: Session) -> LiveClassOut:
    course = db.get(Course, item.course_id)
    return LiveClassOut(
        id=item.id,
        course_id=item.course_id,
        course_title=course.title if course else None,
        title=item.title,
        zoom_meeting_id=item.zoom_meeting_id,
        join_url=item.join_url,
        scheduled_at=item.scheduled_at,
        duration_minutes=item.duration_minutes,
    )
