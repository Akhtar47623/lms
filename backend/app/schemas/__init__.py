from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


class UserOut(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: Literal["admin", "instructor", "student"]
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Tokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(LoginIn):
    first_name: str
    last_name: str
    role: Literal["student", "instructor"] = "student"


class RefreshIn(BaseModel):
    refresh_token: str


class CourseIn(BaseModel):
    title: str
    description: str
    price: float = 0
    thumbnail_url: str | None = None


class CoursePatch(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    status: str | None = None
    price: float | None = None


class CourseOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    thumbnail_url: str | None = None
    instructor_id: int
    instructor_name: str | None = None
    status: Literal["draft", "pending", "published", "rejected", "cancelled"]
    price: float
    lesson_count: int
    enrollment_count: int
    created_at: datetime


class CategoryIn(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class CategoryPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LessonIn(BaseModel):
    title: str
    description: str | None = None
    video_url: str | None = None
    document_url: str | None = None
    duration_seconds: int
    is_preview: bool = False


class LessonPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    video_url: str | None = None
    document_url: str | None = None
    duration_seconds: int | None = None
    is_preview: bool | None = None


class LessonOut(LessonIn):
    id: int
    course_id: int
    order: int

    model_config = ConfigDict(from_attributes=True)


class QuizOut(BaseModel):
    id: int
    course_id: int
    title: str
    passing_score: int
    question_count: int


class QuizQuestionIn(BaseModel):
    question_text: str
    options: list[str]
    correct_option: int


class QuizQuestionPatch(BaseModel):
    question_text: str | None = None
    options: list[str] | None = None
    correct_option: int | None = None
    order: int | None = None


class QuizIn(BaseModel):
    title: str
    passing_score: int = 70
    questions: list[QuizQuestionIn] = []


class QuizPatch(BaseModel):
    title: str | None = None
    passing_score: int | None = None


class CourseDetail(CourseOut):
    lessons: list[LessonOut]
    quizzes: list[QuizOut]


class PaginatedCourses(BaseModel):
    items: list[CourseOut]
    total: int
    page: int
    page_size: int
    pages: int


class EnrollmentIn(BaseModel):
    course_id: int


class EnrollmentOut(BaseModel):
    id: int
    course_id: int
    course_title: str
    progress_percent: int
    enrolled_at: datetime
    completed_at: datetime | None = None


class LessonProgressOut(BaseModel):
    lesson_id: int
    watched_seconds: int
    completed: bool
    last_watched_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseProgressOut(BaseModel):
    course_id: int
    progress_percent: int
    lessons: list[LessonProgressOut]


class ProgressIn(BaseModel):
    watched_seconds: int


class QuizQuestionOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: list[str]
    order: int


class QuizSubmission(BaseModel):
    answers: dict[int, int]


class QuizResult(BaseModel):
    score: int
    passed: bool
    correct_count: int
    total_count: int


class AssignmentIn(BaseModel):
    title: str
    instructions: str
    due_at: datetime | None = None
    max_score: int = 100


class AssignmentPatch(BaseModel):
    title: str | None = None
    instructions: str | None = None
    due_at: datetime | None = None
    max_score: int | None = None


class AssignmentOut(BaseModel):
    id: int
    course_id: int
    title: str
    instructions: str
    due_at: datetime | None = None
    max_score: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignmentSubmissionIn(BaseModel):
    content: str
    attachment_url: str | None = None


class AssignmentReviewIn(BaseModel):
    score: int
    feedback: str | None = None


class AssignmentSubmissionOut(BaseModel):
    id: int
    assignment_id: int
    user_id: int
    content: str
    attachment_url: str | None = None
    score: int | None = None
    feedback: str | None = None
    submitted_at: datetime
    reviewed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CertificateOut(BaseModel):
    id: int
    course_id: int
    course_title: str
    issued_at: datetime
    download_url: str


class LiveClassIn(BaseModel):
    course_id: int
    title: str
    scheduled_at: datetime
    duration_minutes: int


class LiveClassOut(BaseModel):
    id: int
    course_id: int
    course_title: str | None = None
    title: str
    zoom_meeting_id: str
    join_url: str
    scheduled_at: datetime
    duration_minutes: int


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RejectIn(BaseModel):
    reason: str


class TokenAction(BaseModel):
    token: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(TokenAction):
    password: str


class UploadOut(BaseModel):
    filename: str
    url: str
    content_type: str | None
    size: int


class PaginatedUsers(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    page_size: int
    pages: int


class AdminEnrollmentCourseOut(BaseModel):
    course_id: int
    course_title: str
    progress_percent: int
    enrolled_at: datetime
    completed_at: datetime | None = None


class AdminUserOut(UserOut):
    enrolled_courses: list[AdminEnrollmentCourseOut] = []


class PaginatedAdminUsers(BaseModel):
    items: list[AdminUserOut]
    total: int
    page: int
    page_size: int
    pages: int


class UserPatch(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: Literal["admin", "instructor", "student"] | None = None
    avatar_url: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


class PlatformSettingIn(BaseModel):
    key: str
    value: str


class PlatformSettingOut(PlatformSettingIn):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformReportOut(BaseModel):
    total_users: int
    active_students: int
    active_instructors: int
    total_courses: int
    published_courses: int
    pending_courses: int
    total_enrollments: int
    completed_enrollments: int
    live_classes: int
    certificates_issued: int
    quiz_attempts: int
    assignment_submissions: int
