from __future__ import annotations

import base64
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Course, Enrollment, LiveClass, User
from app.schemas import LiveClassIn, LiveClassOut
from app.services.security import require_course_owner_or_admin, require_live_class_access
from app.services.serializers import live_class_out


ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
ZOOM_API_BASE_URL = "https://api.zoom.us/v2"


def list_live_classes(db: Session, user: User, course_id: int | None = None) -> list[LiveClassOut]:
    stmt = select(LiveClass)
    if course_id:
        stmt = stmt.where(LiveClass.course_id == course_id)
    if user.role == "instructor":
        stmt = stmt.join(Course, Course.id == LiveClass.course_id).where(Course.instructor_id == user.id)
    elif user.role == "student":
        enrolled_course_ids = select(Enrollment.course_id).where(Enrollment.user_id == user.id)
        stmt = stmt.where(LiveClass.course_id.in_(enrolled_course_ids))
    classes = db.scalars(stmt.order_by(LiveClass.scheduled_at)).all()
    return [live_class_out(item, db) for item in classes]


def create(payload: LiveClassIn, db: Session, user: User) -> LiveClassOut:
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    require_course_owner_or_admin(user, course)

    meeting = create_zoom_meeting(payload)
    live_class = LiveClass(
        **payload.model_dump(),
        zoom_meeting_id=str(meeting["id"]),
        join_url=meeting["join_url"],
    )

    db.add(live_class)
    db.commit()
    db.refresh(live_class)
    return live_class_out(live_class, db)


def delete(class_id: int, db: Session, user: User) -> dict[str, str]:
    live_class = db.get(LiveClass, class_id)
    if not live_class:
        raise HTTPException(status_code=404, detail="Live class not found")
    require_live_class_access(db, user, live_class)
    db.delete(live_class)
    db.commit()
    return {"detail": "Live class deleted"}


def create_zoom_meeting(payload: LiveClassIn) -> dict[str, object]:
    access_token = get_zoom_access_token()
    body = {
        "topic": payload.title,
        "type": 2,
        "start_time": payload.scheduled_at.replace(microsecond=0).isoformat(),
        "duration": payload.duration_minutes,
        "timezone": settings.zoom_timezone,
        "settings": {
            "join_before_host": False,
            "waiting_room": True,
            "approval_type": 2,
            "audio": "both",
            "auto_recording": "none",
        },
    }
    response = zoom_json_request(
        f"{ZOOM_API_BASE_URL}/users/{settings.zoom_user_id}/meetings",
        method="POST",
        payload=body,
        headers={"Authorization": f"Bearer {access_token}"},
    )

    meeting_id = response.get("id")
    join_url = response.get("join_url")
    if not meeting_id or not join_url:
        raise HTTPException(status_code=502, detail="Zoom did not return a meeting link")
    return response


def get_zoom_access_token() -> str:
    if not settings.zoom_account_id or not settings.zoom_client_id or not settings.zoom_client_secret:
        raise HTTPException(status_code=500, detail="Zoom credentials are not configured")

    credentials = f"{settings.zoom_client_id}:{settings.zoom_client_secret}".encode("utf-8")
    auth_header = base64.b64encode(credentials).decode("utf-8")
    query = urlencode({"grant_type": "account_credentials", "account_id": settings.zoom_account_id})
    response = zoom_json_request(
        f"{ZOOM_TOKEN_URL}?{query}",
        method="POST",
        headers={"Authorization": f"Basic {auth_header}"},
    )
    token = response.get("access_token")
    if not token:
        raise HTTPException(status_code=502, detail="Zoom did not return an access token")
    return str(token)


def zoom_json_request(
    url: str,
    *,
    method: str,
    payload: dict[str, object] | None = None,
    headers: dict[str, str] | None = None,
) -> dict[str, object]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        url,
        data=data,
        method=method,
        headers={
            "Content-Type": "application/json",
            **(headers or {}),
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Zoom API error: {detail}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Zoom API: {exc.reason}") from exc
