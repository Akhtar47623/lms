import { Link, Outlet, useLocation } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore'
import { logout } from '@/store/slices/authSlice'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'

interface NavItem {
  label: string
  href: string
}

interface DashboardLayoutProps {
  title: string
  navItems: NavItem[]
}

export function DashboardLayout({ title, navItems }: DashboardLayoutProps) {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const { toast } = useToast()

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : 'U'

  const isActiveNavItem = (href: string) => {
    if (location.pathname === href) return true
    return href !== '/student' && href !== '/instructor' && href !== '/admin'
      ? location.pathname.startsWith(`${href}/`)
      : false
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-16 items-center">
          <div className="flex h-full shrink-0 items-center px-4 sm:px-6 md:w-64 md:border-r">
            <GraduationCap className="h-7 w-7 text-primary" />
            <div className="ml-3">
              <p className="text-sm font-semibold">LMS Platform</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-end px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar_url} alt={user?.email} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  dispatch(logout())
                  toast({ title: 'Signed out', description: 'You have been logged out.', variant: 'info' })
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
          <nav className="sticky top-16 h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActiveNavItem(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Separator className="mb-6 md:hidden" />
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
                  isActiveNavItem(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
