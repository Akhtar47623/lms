import { useEffect, useState } from 'react'
import { Check, Clock, OctagonX, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { AdminUser, UserRole } from '@/types'

export function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi
      .users({ search, role: roleFilter === 'all' ? undefined : roleFilter })
      .then((res) => setUsers(res.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, roleFilter])

  const updateUserStatus = async (target: AdminUser, isVerified: boolean, isActive: boolean) => {
    try {
      await adminApi.updateUser(target.id, { is_verified: isVerified, is_active: isActive })
      setUsers((prev) => prev.map((user) => (
        user.id === target.id ? { ...user, is_verified: isVerified, is_active: isActive } : user
      )))
      const label = !isActive ? 'cancelled' : isVerified ? 'verified' : 'pending'
      toast({ title: 'User updated', description: `${target.first_name} is now ${label}.`, variant: 'success' })
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Update failed', description: message, variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await adminApi.deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      toast({ title: 'User deleted', description: 'The user was removed from the platform.', variant: 'success' })
      setUserToDelete(null)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Delete failed', description: message, variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage platform users and roles</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="instructor">Instructors</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Enrolled courses
                      </p>
                      {user.enrolled_courses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No enrolled courses.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.enrolled_courses.map((course) => (
                            <Badge key={course.course_id} variant="outline">
                              {course.course_title} · {course.progress_percent}%
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                  <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                  <Badge variant={!user.is_active ? 'destructive' : user.is_verified ? 'success' : 'warning'}>
                    {!user.is_active ? 'Cancelled' : user.is_verified ? 'Verified' : 'Pending'}
                  </Badge>
                  {(!user.is_active || !user.is_verified) && (
                    <Button size="sm" onClick={() => updateUserStatus(user, true, true)}>
                      <Check className="mr-1 h-4 w-4" />
                      Verify
                    </Button>
                  )}
                  {(!user.is_active || user.is_verified) && (
                    <Button size="sm" variant="outline" onClick={() => updateUserStatus(user, false, true)}>
                      <Clock className="mr-1 h-4 w-4" />
                      Pending
                    </Button>
                  )}
                  {user.is_active && (
                    <Button size="sm" variant="outline" onClick={() => updateUserStatus(user, false, false)}>
                      <OctagonX className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    title="Delete user"
                    aria-label={`Delete ${user.first_name} ${user.last_name}`}
                    onClick={() => setUserToDelete(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {!loading && users.length === 0 && (
            <p className="px-6 py-12 text-center text-muted-foreground">No users found.</p>
          )}
        </CardContent>
      </Card>

      {userToDelete && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Delete user?</CardTitle>
              <CardDescription>
                This will permanently delete {userToDelete.first_name} {userToDelete.last_name} and remove their account access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
