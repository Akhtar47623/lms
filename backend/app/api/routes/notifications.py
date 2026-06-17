from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.db.session import Db
from app.models import Notification
from app.schemas import NotificationOut
from app.services.security import CurrentUser


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def notifications(user: CurrentUser, db: Db) -> list[Notification]:
    return list(db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())))


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"detail": "Notification marked read"}


@router.post("/read-all")
def mark_all_read(user: CurrentUser, db: Db) -> dict[str, str]:
    for notification in db.scalars(select(Notification).where(Notification.user_id == user.id)):
        notification.is_read = True
    db.commit()
    return {"detail": "Notifications marked read"}
