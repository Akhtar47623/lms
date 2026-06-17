from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models import Course, Enrollment, Lesson, LessonProgress, Notification, Quiz, QuizQuestion, User
from app.repositories.users import assign_role, get_or_create_role
from app.services.security import hash_password


def seed_data() -> None:
    db = SessionLocal()
    try:
        for role_name in ["STUDENT", "INSTRUCTOR", "ADMIN"]:
            get_or_create_role(db, role_name)
        db.commit()

        if db.scalar(select(func.count(User.id))):
            return

        admin = User(email="admin@example.com", hashed_password=hash_password("password123"), first_name="Admin", last_name="User", is_verified=True)
        instructor = User(email="instructor@example.com", hashed_password=hash_password("password123"), first_name="Aisha", last_name="Khan", is_verified=True)
        student = User(email="student@example.com", hashed_password=hash_password("password123"), first_name="Waheed", last_name="Student", is_verified=True)
        db.add_all([admin, instructor, student])
        db.flush()
        assign_role(db, admin, "admin")
        assign_role(db, instructor, "instructor")
        assign_role(db, student, "student")
        db.commit()
        db.refresh(instructor)
        db.refresh(student)

        course = Course(
            title="Modern React Foundations",
            slug="modern-react-foundations",
            description="Build production-ready React interfaces with routing, forms, and API state.",
            thumbnail_url="/uploads/react-course.png",
            instructor_id=instructor.id,
            status="published",
            price=29,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        db.add_all([
            Lesson(course_id=course.id, title="Welcome and setup", description="Prepare your development environment.", video_url="https://www.w3schools.com/html/mov_bbb.mp4", duration_seconds=120, order=1, is_preview=True),
            Lesson(course_id=course.id, title="Components and props", description="Compose reusable UI pieces.", video_url="https://www.w3schools.com/html/movie.mp4", duration_seconds=180, order=2, is_preview=False),
        ])
        quiz = Quiz(course_id=course.id, title="React Basics Quiz", passing_score=70)
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        db.add_all([
            QuizQuestion(quiz_id=quiz.id, question_text="What does JSX compile to?", options="HTML strings|React elements|CSS rules|Database rows", correct_option=1, order=1),
            QuizQuestion(quiz_id=quiz.id, question_text="Which hook stores local component state?", options="useState|useRouter|useMemoizedDb|useStyle", correct_option=0, order=2),
        ])
        enrollment = Enrollment(user_id=student.id, course_id=course.id, progress_percent=0)
        db.add(enrollment)
        db.add(Notification(user_id=student.id, title="Welcome", message="Your LMS account is ready."))
        db.commit()
        db.refresh(enrollment)
        lessons = db.scalars(select(Lesson).where(Lesson.course_id == course.id)).all()
        for lesson in lessons:
            db.add(LessonProgress(enrollment_id=enrollment.id, lesson_id=lesson.id))
        db.commit()
    finally:
        db.close()
