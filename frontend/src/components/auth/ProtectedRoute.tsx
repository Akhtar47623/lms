import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardPath = getDashboardPath(user.role)
    return <Navigate to={dashboardPath} replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'instructor':
      return '/instructor'
    case 'student':
      return '/student'
    default:
      return '/'
  }
}
