export type UserRole = 'admin' | 'instructor' | 'student'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Course {
  id: number
  title: string
  slug: string
  description: string
  thumbnail_url?: string
  instructor_id: number
  instructor_name?: string
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'cancelled'
  price: number
  lesson_count: number
  enrollment_count: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface CourseDetail extends Course {
  lessons: Lesson[]
  quizzes: Quiz[]
}

export interface Lesson {
  id: number
  course_id: number
  title: string
  description?: string
  video_url?: string
  document_url?: string
  duration_seconds: number
  order: number
  is_preview: boolean
}

export interface Enrollment {
  id: number
  course_id: number
  course_title: string
  progress_percent: number
  enrolled_at: string
  completed_at?: string
}

export interface Quiz {
  id: number
  course_id: number
  title: string
  passing_score: number
  question_count: number
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  question_text: string
  options: string[]
  order: number
}

export interface CreateQuizPayload {
  title: string
  passing_score: number
  questions: {
    question_text: string
    options: string[]
    correct_option: number
  }[]
}

export interface QuizAttempt {
  id: number
  quiz_id: number
  score: number
  passed: boolean
  completed_at: string
}

export interface QuizSubmission {
  answers: Record<number, number>
}

export interface QuizResult {
  score: number
  passed: boolean
  correct_count: number
  total_count: number
}

export interface Certificate {
  id: number
  course_id: number
  course_title: string
  issued_at: string
  download_url: string
}

export interface Assignment {
  id: number
  course_id: number
  title: string
  instructions: string
  due_at?: string
  max_score: number
  created_at: string
}

export interface AssignmentSubmission {
  id: number
  assignment_id: number
  user_id: number
  content: string
  attachment_url?: string
  score?: number
  feedback?: string
  submitted_at: string
  reviewed_at?: string
}

export interface ProgressTracking {
  lesson_id: number
  watched_seconds: number
  completed: boolean
  last_watched_at: string
}

export interface CourseProgress {
  course_id: number
  progress_percent: number
  lessons: ProgressTracking[]
}

export interface LiveClass {
  id: number
  course_id: number
  course_title?: string
  title: string
  zoom_meeting_id: string
  join_url: string
  scheduled_at: string
  duration_minutes: number
}

export interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface AdminEnrollmentCourse {
  course_id: number
  course_title: string
  progress_percent: number
  enrolled_at: string
  completed_at?: string
}

export interface AdminUser extends User {
  enrolled_courses: AdminEnrollmentCourse[]
}

export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

export interface CreateCoursePayload {
  title: string
  description: string
  price: number
  thumbnail_url?: string
}

export interface CreateLessonPayload {
  title: string
  description?: string
  video_url?: string
  document_url?: string
  duration_seconds: number
  is_preview: boolean
}

export interface CreateLiveClassPayload {
  course_id: number
  title: string
  scheduled_at: string
  duration_minutes: number
}

export interface PlatformSetting {
  id: number
  key: string
  value: string
  updated_at: string
}

export interface PlatformReport {
  total_users: number
  active_students: number
  active_instructors: number
  total_courses: number
  published_courses: number
  pending_courses: number
  total_enrollments: number
  completed_enrollments: number
  live_classes: number
  certificates_issued: number
  quiz_attempts: number
  assignment_submissions: number
}
