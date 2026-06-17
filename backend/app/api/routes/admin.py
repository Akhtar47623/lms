from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.db.session import Db
from app.models import CourseCategory, User
from app.schemas import (
    CategoryIn,
    CategoryOut,
    CategoryPatch,
    CourseOut,
    EnrollmentOut,
    PaginatedAdminUsers,
    PlatformReportOut,
    PlatformSettingIn,
    PlatformSettingOut,
    UserOut,
    UserPatch,
)
from app.services import admin as admin_service
from app.services.courses import make_slug
from app.services.security import CurrentUser, require_roles


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=PaginatedAdminUsers)
def admin_users(
    user: CurrentUser,
    db: Db,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str | None = None,
    search: str | None = None,
) -> PaginatedAdminUsers:
    require_roles(user, "admin")
    return admin_service.list_users(db, page=page, page_size=page_size, role=role, search=search)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserPatch, user: CurrentUser, db: Db) -> User:
    require_roles(user, "admin")
    return admin_service.update_user(db, user_id, payload)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    return admin_service.delete_user(db, user_id)


@router.get("/courses", response_model=list[CourseOut])
def admin_courses(user: CurrentUser, db: Db, status: str | None = None) -> list[CourseOut]:
    require_roles(user, "admin")
    return admin_service.list_courses(db, status)


@router.get("/courses/pending", response_model=list[CourseOut])
def pending_courses(user: CurrentUser, db: Db) -> list[CourseOut]:
    require_roles(user, "admin")
    return admin_service.list_courses(db, "pending")


@router.get("/enrollments", response_model=list[EnrollmentOut])
def admin_enrollments(
    user: CurrentUser,
    db: Db,
    course_id: int | None = None,
    user_id: int | None = None,
) -> list[EnrollmentOut]:
    require_roles(user, "admin")
    return admin_service.list_enrollments(db, course_id=course_id, user_id=user_id)


@router.post("/courses/{course_id}/approve")
def approve_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    return admin_service.approve_course(db, course_id)


@router.post("/courses/{course_id}/cancel")
def cancel_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    return admin_service.cancel_course(db, course_id)


@router.post("/courses/{course_id}/pending")
def pending_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    return admin_service.pending_course(db, course_id)


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    return admin_service.delete_course(db, course_id)


@router.get("/stats")
def admin_stats(user: CurrentUser, db: Db) -> dict[str, int | float]:
    require_roles(user, "admin")
    return admin_service.stats(db)


@router.get("/reports", response_model=PlatformReportOut)
def reports(user: CurrentUser, db: Db) -> PlatformReportOut:
    require_roles(user, "admin")
    return admin_service.platform_report(db)


@router.get("/categories", response_model=list[CategoryOut])
def categories(user: CurrentUser, db: Db) -> list[CourseCategory]:
    require_roles(user, "admin")
    return admin_service.list_categories(db)


@router.post("/categories", response_model=CategoryOut)
def create_category(payload: CategoryIn, user: CurrentUser, db: Db) -> CourseCategory:
    require_roles(user, "admin")
    slug = make_slug(payload.name)
    suffix = 2
    while db.scalar(select(CourseCategory).where(CourseCategory.slug == slug)):
        slug = f"{make_slug(payload.name)}-{suffix}"
        suffix += 1
    category = CourseCategory(slug=slug, **payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryPatch, user: CurrentUser, db: Db) -> CourseCategory:
    require_roles(user, "admin")
    category = db.get(CourseCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        category.slug = make_slug(data["name"])
    for key, value in data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, user: CurrentUser, db: Db) -> dict[str, str]:
    require_roles(user, "admin")
    category = db.get(CourseCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"detail": "Category deleted"}


@router.get("/settings", response_model=list[PlatformSettingOut])
def settings(user: CurrentUser, db: Db) -> list[PlatformSettingOut]:
    require_roles(user, "admin")
    return admin_service.list_settings(db)


@router.put("/settings/{key}", response_model=PlatformSettingOut)
def upsert_setting(key: str, payload: PlatformSettingIn, user: CurrentUser, db: Db) -> PlatformSettingOut:
    require_roles(user, "admin")
    return admin_service.upsert_setting(db, PlatformSettingIn(key=key, value=payload.value))
