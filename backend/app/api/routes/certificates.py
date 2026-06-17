from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.routes.enrollments import get_enrollment_or_404
from app.db.session import Db
from app.models import Certificate, Course
from app.schemas import CertificateOut, EnrollmentIn
from app.services.security import CurrentUser
from app.services.serializers import certificate_out


router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("", response_model=list[CertificateOut])
def certificates(user: CurrentUser, db: Db) -> list[CertificateOut]:
    rows = db.scalars(select(Certificate).where(Certificate.user_id == user.id)).all()
    return [certificate_out(c, db) for c in rows]


@router.post("/generate", response_model=CertificateOut)
def generate_certificate(payload: EnrollmentIn, user: CurrentUser, db: Db) -> CertificateOut:
    enrollment = get_enrollment_or_404(db, user.id, payload.course_id)
    if enrollment.progress_percent < 100:
        raise HTTPException(status_code=400, detail="Complete the course before generating a certificate")
    certificate = db.scalar(select(Certificate).where(Certificate.user_id == user.id, Certificate.course_id == payload.course_id))
    if not certificate:
        certificate = Certificate(user_id=user.id, course_id=payload.course_id)
        db.add(certificate)
        db.commit()
        db.refresh(certificate)
    return certificate_out(certificate, db)


@router.get("/{certificate_id}/download")
def download_certificate(certificate_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    cert = db.get(Certificate, certificate_id)
    if not cert or (user.role != "admin" and cert.user_id != user.id):
        raise HTTPException(status_code=404, detail="Certificate not found")
    course = db.get(Course, cert.course_id)
    return {"certificate": cert.code, "course": course.title if course else "Course"}
