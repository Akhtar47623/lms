from fastapi import APIRouter

from app.db.session import Db
from app.schemas import LiveClassIn, LiveClassOut
from app.services.security import CurrentUser, require_roles
from app.services import live_class


router = APIRouter(prefix="/live-classes", tags=["live-classes"])


@router.get("", response_model=list[LiveClassOut])
def list_live_classes(user: CurrentUser, db: Db, course_id: int | None = None) -> list[LiveClassOut]:
    return live_class.list_live_classes(db, user, course_id)


@router.post("", response_model=LiveClassOut)
def create_live_class(
    payload: LiveClassIn,
    user: CurrentUser,
    db: Db,
) -> LiveClassOut:
    require_roles(user, "instructor", "admin")
    return live_class.create(payload, db, user)


@router.delete("/{class_id}")
def delete_live_class(class_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "instructor", "admin")
    return live_class.delete(class_id, db, user)
