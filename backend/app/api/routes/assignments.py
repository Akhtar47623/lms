from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.db.session import Db
from app.models import Assignment, AssignmentSubmission, Course, Enrollment
from app.schemas import (
    AssignmentIn,
    AssignmentOut,
    AssignmentPatch,
    AssignmentReviewIn,
    AssignmentSubmissionIn,
    AssignmentSubmissionOut,
)
from app.services.security import CurrentUser, require_course_access, require_course_owner_or_admin, require_roles


router = APIRouter(tags=["assignments"])


def get_assignment_or_404(db: Db, assignment_id: int) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.get("/courses/{course_id}/assignments", response_model=list[AssignmentOut])
def list_assignments(course_id: int, user: CurrentUser, db: Db) -> list[Assignment]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_access(db, user, course)
    return list(db.scalars(select(Assignment).where(Assignment.course_id == course_id).order_by(Assignment.created_at)))


@router.post("/courses/{course_id}/assignments", response_model=AssignmentOut)
def create_assignment(course_id: int, payload: AssignmentIn, user: CurrentUser, db: Db) -> Assignment:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    assignment = Assignment(course_id=course_id, **payload.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.patch("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(assignment_id: int, payload: AssignmentPatch, user: CurrentUser, db: Db) -> Assignment:
    assignment = get_assignment_or_404(db, assignment_id)
    course = db.get(Course, assignment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, key, value)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    assignment = get_assignment_or_404(db, assignment_id)
    course = db.get(Course, assignment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    submissions = db.scalars(select(AssignmentSubmission).where(AssignmentSubmission.assignment_id == assignment_id)).all()
    for submission in submissions:
        db.delete(submission)
    db.delete(assignment)
    db.commit()
    return {"detail": "Assignment deleted"}


@router.post("/assignments/{assignment_id}/submissions", response_model=AssignmentSubmissionOut)
def submit_assignment(
    assignment_id: int,
    payload: AssignmentSubmissionIn,
    user: CurrentUser,
    db: Db,
) -> AssignmentSubmission:
    require_roles(user, "student")
    assignment = get_assignment_or_404(db, assignment_id)
    enrollment = db.scalar(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == assignment.course_id)
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    existing = db.scalar(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.user_id == user.id,
        )
    )
    if existing:
        existing.content = payload.content
        existing.attachment_url = payload.attachment_url
        existing.submitted_at = datetime.utcnow()
        existing.score = None
        existing.feedback = None
        existing.reviewed_at = None
        db.commit()
        db.refresh(existing)
        return existing
    submission = AssignmentSubmission(assignment_id=assignment_id, user_id=user.id, **payload.model_dump())
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/assignments/{assignment_id}/submissions", response_model=list[AssignmentSubmissionOut])
def list_submissions(assignment_id: int, user: CurrentUser, db: Db) -> list[AssignmentSubmission]:
    assignment = get_assignment_or_404(db, assignment_id)
    course = db.get(Course, assignment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role == "student":
        return list(
            db.scalars(
                select(AssignmentSubmission).where(
                    AssignmentSubmission.assignment_id == assignment_id,
                    AssignmentSubmission.user_id == user.id,
                )
            )
        )
    require_course_owner_or_admin(user, course)
    return list(db.scalars(select(AssignmentSubmission).where(AssignmentSubmission.assignment_id == assignment_id)))


@router.patch("/assignment-submissions/{submission_id}/review", response_model=AssignmentSubmissionOut)
def review_submission(
    submission_id: int,
    payload: AssignmentReviewIn,
    user: CurrentUser,
    db: Db,
) -> AssignmentSubmission:
    submission = db.get(AssignmentSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    assignment = get_assignment_or_404(db, submission.assignment_id)
    course = db.get(Course, assignment.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)
    if payload.score > assignment.max_score:
        raise HTTPException(status_code=400, detail="Score cannot exceed assignment max score")
    submission.score = payload.score
    submission.feedback = payload.feedback
    submission.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    return submission
