import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/services/api'
import type { Notification } from '@/types'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    notificationsApi
      .list()
      .then((res) => setNotifications(res.data))
      .catch(() => setNotifications([]))
  }, [])

  const markRead = async (id: number) => {
    await notificationsApi.markRead(id).catch(() => {})
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
  }

  const markAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button type="button" className="text-xs text-primary hover:underline" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-accent',
                      !n.is_read && 'bg-primary/5',
                    )}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
