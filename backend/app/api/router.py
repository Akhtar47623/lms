from fastapi import APIRouter

from app.api.routes import admin, assignments, auth, certificates, courses, enrollments, health, instructor, live_classes, notifications, quizzes, uploads


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(courses.router)
api_router.include_router(enrollments.router)
api_router.include_router(quizzes.router)
api_router.include_router(assignments.router)
api_router.include_router(certificates.router)
api_router.include_router(live_classes.router)
api_router.include_router(notifications.router)
api_router.include_router(uploads.router)
api_router.include_router(admin.router)
api_router.include_router(instructor.router)
