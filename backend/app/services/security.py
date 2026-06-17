from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import Db
from app.models import Course, Enrollment, LiveClass, Quiz, User
from app.schemas import Tokens


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    expire = now_utc() + expires_delta
    return jwt.encode({"sub": subject, "type": token_type, "exp": expire}, settings.secret_key, algorithm="HS256")


def build_tokens(user: User) -> Tokens:
    return Tokens(
        access_token=create_token(str(user.id), "access", timedelta(minutes=settings.access_token_minutes)),
        refresh_token=create_token(str(user.id), "refresh", timedelta(days=settings.refresh_token_days)),
    )


def current_user(
    db: Db,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is cancelled")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require_roles(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


def require_course_owner_or_admin(user: User, course: Course) -> None:
    if user.role == "admin":
        return
    if user.role == "instructor" and course.instructor_id == user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


def require_course_access(db: Session, user: User, course: Course) -> None:
    if user.role == "admin":
        return
    if user.role == "instructor" and course.instructor_id == user.id:
        return
    if user.role == "student":
        enrollment = db.scalar(
            select(Enrollment).where(
                Enrollment.user_id == user.id,
                Enrollment.course_id == course.id,
            )
        )
        if enrollment:
            return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this course")


def require_quiz_access(db: Session, user: User, quiz: Quiz) -> None:
    course = db.get(Course, quiz.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    require_course_access(db, user, course)


def require_live_class_access(db: Session, user: User, live_class: LiveClass) -> None:
    course = db.get(Course, live_class.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    require_course_access(db, user, course)
