import { api } from '@/lib/api'
import type {
  AuthTokens,
  Certificate,
  Course,
  CourseDetail,
  CourseProgress,
  CreateCoursePayload,
  CreateLessonPayload,
  CreateLiveClassPayload,
  Enrollment,
  Lesson,
  LiveClass,
  Notification,
  PaginatedResponse,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizResult,
  QuizSubmission,
  User,
  AdminUser,
  Assignment,
  AssignmentSubmission,
  Category,
  CreateQuizPayload,
  PlatformReport,
  PlatformSetting,
} from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: 'student' | 'instructor'
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/login', payload),
  register: (payload: RegisterPayload) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/register', payload),
  me: () => api.get<User>('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
}

export const coursesApi = {
  list: (params?: { page?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<Course>>('/courses', { params }),
  get: (id: number) => api.get<CourseDetail>(`/courses/${id}`),
  getBySlug: (slug: string) => api.get<CourseDetail>(`/courses/slug/${slug}`),
  create: (data: CreateCoursePayload) => api.post<Course>('/courses', data),
  update: (id: number, data: Partial<Course>) => api.patch<Course>(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
  submitForApproval: (id: number) => api.post(`/courses/${id}/submit`),
  archive: (id: number) => api.post(`/courses/${id}/archive`),
  approve: (id: number) => api.post(`/courses/${id}/approve`),
  reject: (id: number, reason: string) => api.post(`/courses/${id}/reject`, { reason }),
}

export const lessonsApi = {
  list: (courseId: number) => api.get<Lesson[]>(`/courses/${courseId}/lessons`),
  create: (courseId: number, data: CreateLessonPayload) =>
    api.post<Lesson>(`/courses/${courseId}/lessons`, data),
  update: (courseId: number, lessonId: number, data: Partial<CreateLessonPayload>) =>
    api.patch<Lesson>(`/courses/${courseId}/lessons/${lessonId}`, data),
  delete: (courseId: number, lessonId: number) =>
    api.delete(`/courses/${courseId}/lessons/${lessonId}`),
}

export const enrollmentsApi = {
  list: () => api.get<Enrollment[]>('/enrollments'),
  enroll: (courseId: number) => api.post<Enrollment>('/enrollments', { course_id: courseId }),
  progress: (courseId: number) => api.get<CourseProgress>(`/enrollments/${courseId}/progress`),
  updateLessonProgress: (courseId: number, lessonId: number, watchedSeconds: number) =>
    api.post(`/enrollments/${courseId}/lessons/${lessonId}/progress`, {
      watched_seconds: watchedSeconds,
    }),
}

export const quizzesApi = {
  list: (courseId: number) => api.get<Quiz[]>(`/courses/${courseId}/quizzes`),
  create: (courseId: number, data: CreateQuizPayload) =>
    api.post<Quiz>(`/courses/${courseId}/quizzes`, data),
  get: (quizId: number) => api.get<Quiz>(`/quizzes/${quizId}`),
  update: (quizId: number, data: Partial<Quiz>) => api.patch<Quiz>(`/quizzes/${quizId}`, data),
  delete: (quizId: number) => api.delete(`/quizzes/${quizId}`),
  getQuestions: (quizId: number) => api.get<QuizQuestion[]>(`/quizzes/${quizId}/questions`),
  createQuestion: (
    quizId: number,
    data: { question_text: string; options: string[]; correct_option: number },
  ) => api.post<QuizQuestion>(`/quizzes/${quizId}/questions`, data),
  updateQuestion: (
    quizId: number,
    questionId: number,
    data: Partial<{ question_text: string; options: string[]; correct_option: number; order: number }>,
  ) => api.patch<QuizQuestion>(`/quizzes/${quizId}/questions/${questionId}`, data),
  deleteQuestion: (quizId: number, questionId: number) =>
    api.delete(`/quizzes/${quizId}/questions/${questionId}`),
  submit: (quizId: number, data: QuizSubmission) =>
    api.post<QuizResult>(`/quizzes/${quizId}/submit`, data),
  attempts: (quizId: number) => api.get<QuizAttempt[]>(`/quizzes/${quizId}/attempts`),
}

export const assignmentsApi = {
  list: (courseId: number) => api.get<Assignment[]>(`/courses/${courseId}/assignments`),
  create: (courseId: number, data: Omit<Assignment, 'id' | 'course_id' | 'created_at'>) =>
    api.post<Assignment>(`/courses/${courseId}/assignments`, data),
  update: (assignmentId: number, data: Partial<Assignment>) =>
    api.patch<Assignment>(`/assignments/${assignmentId}`, data),
  delete: (assignmentId: number) => api.delete(`/assignments/${assignmentId}`),
  submit: (assignmentId: number, data: { content: string; attachment_url?: string }) =>
    api.post<AssignmentSubmission>(`/assignments/${assignmentId}/submissions`, data),
  submissions: (assignmentId: number) =>
    api.get<AssignmentSubmission[]>(`/assignments/${assignmentId}/submissions`),
  review: (submissionId: number, data: { score: number; feedback?: string }) =>
    api.patch<AssignmentSubmission>(`/assignment-submissions/${submissionId}/review`, data),
}

export const certificatesApi = {
  list: () => api.get<Certificate[]>('/certificates'),
  download: (id: number) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }),
  generate: (courseId: number) => api.post<Certificate>(`/certificates/generate`, { course_id: courseId }),
}

export const liveClassesApi = {
  list: (params?: { course_id?: number }) => api.get<LiveClass[]>('/live-classes', { params }),
  create: (data: CreateLiveClassPayload) => api.post<LiveClass>('/live-classes', data),
  delete: (id: number) => api.delete(`/live-classes/${id}`),
}

export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

export const adminApi = {
  users: (params?: { page?: number; role?: string; search?: string }) =>
    api.get<PaginatedResponse<AdminUser>>('/admin/users', { params }),
  updateUser: (id: number, data: Partial<User>) => api.patch<User>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  courses: (params?: { status?: string }) => api.get<Course[]>('/admin/courses', { params }),
  approveCourse: (id: number) => api.post(`/admin/courses/${id}/approve`),
  pendingCourse: (id: number) => api.post(`/admin/courses/${id}/pending`),
  cancelCourse: (id: number) => api.post(`/admin/courses/${id}/cancel`),
  deleteCourse: (id: number) => api.delete(`/admin/courses/${id}`),
  enrollments: (params?: { course_id?: number; user_id?: number }) =>
    api.get<Enrollment[]>('/admin/enrollments', { params }),
  liveClasses: (params?: { course_id?: number }) =>
    api.get<LiveClass[]>('/live-classes', { params }),
  deleteLiveClass: (id: number) => api.delete(`/live-classes/${id}`),
  pendingCourses: () => api.get<Course[]>('/admin/courses/pending'),
  stats: () =>
    api.get<{
      total_users: number
      active_courses: number
      certificates_issued: number
      growth_percent: number
    }>('/admin/stats'),
  reports: () => api.get<PlatformReport>('/admin/reports'),
  categories: () => api.get<Category[]>('/admin/categories'),
  createCategory: (data: { name: string; description?: string; is_active?: boolean }) =>
    api.post<Category>('/admin/categories', data),
  updateCategory: (id: number, data: Partial<Category>) => api.patch<Category>(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  settings: () => api.get<PlatformSetting[]>('/admin/settings'),
  updateSetting: (key: string, value: string) => api.put<PlatformSetting>(`/admin/settings/${key}`, { key, value }),
}

export const instructorApi = {
  students: (courseId?: number) =>
    api.get<PaginatedResponse<User>>('/instructor/students', { params: { course_id: courseId } }),
  analytics: () =>
    api.get<{
      total_courses: number
      total_students: number
      live_sessions: number
      completion_rate: number
    }>('/instructor/analytics'),
  myCourses: () => api.get<Course[]>('/instructor/courses'),
}
