from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.db.session import Db
from app.models import Course, Quiz, QuizAttempt, QuizQuestion
from app.schemas import QuizIn, QuizOut, QuizPatch, QuizQuestionIn, QuizQuestionOut, QuizQuestionPatch, QuizResult, QuizSubmission
from app.services.security import CurrentUser, require_course_access, require_course_owner_or_admin, require_quiz_access, require_roles
from app.services.serializers import quiz_out


router = APIRouter(tags=["quizzes"])


@router.get("/courses/{course_id}/quizzes", response_model=list[QuizOut])
def list_quizzes(course_id: int, user: CurrentUser, db: Db) -> list[QuizOut]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_access(db, user, course)
    quizzes = db.scalars(select(Quiz).where(Quiz.course_id == course_id)).all()
    return [quiz_out(q) for q in quizzes]


@router.post("/courses/{course_id}/quizzes", response_model=QuizOut)
def create_quiz(course_id: int, payload: QuizIn, user: CurrentUser, db: Db) -> QuizOut:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    quiz = Quiz(course_id=course_id, title=payload.title, passing_score=payload.passing_score)
    db.add(quiz)
    db.flush()
    for index, question in enumerate(payload.questions, start=1):
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question_text=question.question_text,
                options="|".join(question.options),
                correct_option=question.correct_option,
                order=index,
            )
        )
    db.commit()
    db.refresh(quiz)
    return quiz_out(quiz)


@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, user: CurrentUser, db: Db) -> QuizOut:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    require_quiz_access(db, user, quiz)
    return quiz_out(quiz)


@router.get("/quizzes/{quiz_id}/questions", response_model=list[QuizQuestionOut])
def get_questions(quiz_id: int, user: CurrentUser, db: Db) -> list[QuizQuestionOut]:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    require_quiz_access(db, user, quiz)
    questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order)).all()
    return [
        QuizQuestionOut(id=q.id, quiz_id=q.quiz_id, question_text=q.question_text, options=q.options.split("|"), order=q.order)
        for q in questions
    ]


@router.patch("/quizzes/{quiz_id}", response_model=QuizOut)
def update_quiz(quiz_id: int, payload: QuizPatch, user: CurrentUser, db: Db) -> QuizOut:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    course = db.get(Course, quiz.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(quiz, key, value)
    db.commit()
    db.refresh(quiz)
    return quiz_out(quiz)


@router.post("/quizzes/{quiz_id}/questions", response_model=QuizQuestionOut)
def create_question(quiz_id: int, payload: QuizQuestionIn, user: CurrentUser, db: Db) -> QuizQuestionOut:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    course = db.get(Course, quiz.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    order = (db.scalar(select(QuizQuestion.order).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order.desc())) or 0) + 1
    question = QuizQuestion(
        quiz_id=quiz_id,
        question_text=payload.question_text,
        options="|".join(payload.options),
        correct_option=payload.correct_option,
        order=order,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuizQuestionOut(
        id=question.id,
        quiz_id=question.quiz_id,
        question_text=question.question_text,
        options=question.options.split("|"),
        order=question.order,
    )


@router.patch("/quizzes/{quiz_id}/questions/{question_id}", response_model=QuizQuestionOut)
def update_question(quiz_id: int, question_id: int, payload: QuizQuestionPatch, user: CurrentUser, db: Db) -> QuizQuestionOut:
    quiz = db.get(Quiz, quiz_id)
    question = db.get(QuizQuestion, question_id)
    if not quiz or not question or question.quiz_id != quiz_id:
        raise HTTPException(status_code=404, detail="Question not found")
    course = db.get(Course, quiz.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    data = payload.model_dump(exclude_unset=True)
    if "options" in data:
        question.options = "|".join(data.pop("options"))
    for key, value in data.items():
        setattr(question, key, value)
    db.commit()
    db.refresh(question)
    return QuizQuestionOut(
        id=question.id,
        quiz_id=question.quiz_id,
        question_text=question.question_text,
        options=question.options.split("|"),
        order=question.order,
    )


@router.delete("/quizzes/{quiz_id}/questions/{question_id}")
def delete_question(quiz_id: int, question_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    quiz = db.get(Quiz, quiz_id)
    question = db.get(QuizQuestion, question_id)
    if not quiz or not question or question.quiz_id != quiz_id:
        raise HTTPException(status_code=404, detail="Question not found")
    course = db.get(Course, quiz.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    db.delete(question)
    db.commit()
    return {"detail": "Question deleted"}


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    course = db.get(Course, quiz.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    attempts = db.scalars(select(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id)).all()
    for attempt in attempts:
        db.delete(attempt)
    for question in quiz.questions:
        db.delete(question)
    db.delete(quiz)
    db.commit()
    return {"detail": "Quiz deleted"}


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResult)
def submit_quiz(quiz_id: int, payload: QuizSubmission, user: CurrentUser, db: Db) -> QuizResult:
    require_roles(user, "student")
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    require_quiz_access(db, user, quiz)
    total = len(quiz.questions)
    correct = sum(1 for q in quiz.questions if payload.answers.get(q.id) == q.correct_option)
    score = round((correct / max(1, total)) * 100)
    passed = score >= quiz.passing_score
    db.add(QuizAttempt(user_id=user.id, quiz_id=quiz_id, score=score, passed=passed))
    db.commit()
    return QuizResult(score=score, passed=passed, correct_count=correct, total_count=total)


@router.get("/quizzes/{quiz_id}/attempts")
def quiz_attempts(quiz_id: int, user: CurrentUser, db: Db) -> list[dict[str, int | bool | datetime]]:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    require_quiz_access(db, user, quiz)
    attempts = db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user.id, QuizAttempt.quiz_id == quiz_id)).all()
    return [{"id": a.id, "quiz_id": a.quiz_id, "score": a.score, "passed": a.passed, "completed_at": a.completed_at} for a in attempts]
