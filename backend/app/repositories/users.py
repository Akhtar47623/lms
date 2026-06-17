from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Role, User, UserRole


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def get_or_create_role(db: Session, role_name: str) -> Role:
    normalized = role_name.upper()
    role = db.scalar(select(Role).where(Role.name == normalized))
    if role:
        return role
    role = Role(name=normalized)
    db.add(role)
    db.flush()
    return role


def assign_role(db: Session, user: User, role_name: str) -> None:
    role = get_or_create_role(db, role_name)
    existing = db.scalar(select(UserRole).where(UserRole.user_id == user.id))
    if existing:
        existing.role_id = role.id
    else:
        db.add(UserRole(user_id=user.id, role_id=role.id))
