import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute, GuestRoute } from '@/components/auth/ProtectedRoute'
import { LandingPage } from '@/pages/public/LandingPage'
import { CourseCatalogPage } from '@/pages/public/CourseCatalogPage'
import { CourseDetailPage } from '@/pages/public/CourseDetailPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { MyCoursesPage } from '@/pages/student/MyCoursesPage'
import { StudentCourseCatalogPage } from '@/pages/student/StudentCourseCatalogPage'
import { StudentCourseDetailPage } from '@/pages/student/StudentCourseDetailPage'
import { CertificatesPage } from '@/pages/student/CertificatesPage'
import { CourseLearningPage } from '@/pages/student/CourseLearningPage'
import { QuizPage } from '@/pages/student/QuizPage'
import { InstructorDashboard } from '@/pages/instructor/InstructorDashboard'
import { InstructorCoursesPage } from '@/pages/instructor/InstructorCoursesPage'
import { CreateCoursePage } from '@/pages/instructor/CreateCoursePage'
import { EditCoursePage } from '@/pages/instructor/EditCoursePage'
import { InstructorCourseViewPage } from '@/pages/instructor/InstructorCourseViewPage'
import { LiveClassesPage } from '@/pages/instructor/LiveClassesPage'
import { InstructorStudentsPage } from '@/pages/instructor/InstructorStudentsPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminCourseApprovalsPage } from '@/pages/admin/AdminCourseApprovalsPage'
import { AdminEnrollmentsPage } from '@/pages/admin/AdminEnrollmentsPage'
import { AdminLiveClassesPage } from '@/pages/admin/AdminLiveClassesPage'

const studentNav = [
  { label: 'Dashboard', href: '/student' },
  { label: 'My Courses', href: '/student/courses' },
  { label: 'Browse Courses', href: '/student/catalog' },
  { label: 'Certificates', href: '/student/certificates' },
]

const instructorNav = [
  { label: 'Dashboard', href: '/instructor' },
  { label: 'My Courses', href: '/instructor/courses' },
  { label: 'Students', href: '/instructor/students' },
  { label: 'Live Classes', href: '/instructor/live-classes' },
  { label: 'Analytics', href: '/instructor/analytics' },
]

const adminNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Enrollments', href: '/admin/enrollments' },
  { label: 'Live Classes', href: '/admin/live-classes' },
  { label: 'Certificates', href: '/admin/certificates' },
  { label: 'Reports', href: '/admin/reports' },
]

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/courses', element: <CourseCatalogPage /> },
  { path: '/courses/:slug', element: <CourseDetailPage /> },

  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      {
        path: '/student',
        element: <DashboardLayout title="Student Portal" navItems={studentNav} />,
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: 'courses', element: <MyCoursesPage /> },
          { path: 'courses/:courseId', element: <CourseLearningPage /> },
          { path: 'courses/:courseId/quiz/:quizId', element: <QuizPage /> },
          { path: 'catalog', element: <StudentCourseCatalogPage /> },
          { path: 'catalog/:courseId', element: <StudentCourseDetailPage /> },
          { path: 'certificates', element: <CertificatesPage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['instructor']} />,
    children: [
      {
        path: '/instructor',
        element: <DashboardLayout title="Instructor Portal" navItems={instructorNav} />,
        children: [
          { index: true, element: <InstructorDashboard /> },
          { path: 'courses', element: <InstructorCoursesPage /> },
          { path: 'courses/new', element: <CreateCoursePage /> },
          { path: 'courses/:courseId/view', element: <InstructorCourseViewPage /> },
          { path: 'courses/:courseId/edit', element: <EditCoursePage /> },
          { path: 'students', element: <InstructorStudentsPage /> },
          { path: 'live-classes', element: <LiveClassesPage /> },
          { path: 'analytics', element: <PlaceholderPage title="Analytics" /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        element: <DashboardLayout title="Admin Panel" navItems={adminNav} />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'courses', element: <AdminCourseApprovalsPage /> },
          { path: 'enrollments', element: <AdminEnrollmentsPage /> },
          { path: 'live-classes', element: <AdminLiveClassesPage /> },
          { path: 'certificates', element: <PlaceholderPage title="Certificate Management" /> },
          { path: 'reports', element: <PlaceholderPage title="Reports & Analytics" /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">Coming in a future release.</p>
    </div>
  )
}
