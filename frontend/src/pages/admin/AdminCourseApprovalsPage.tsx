import { useEffect, useState } from 'react'
import { Check, Clock, OctagonX, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { Course } from '@/types'

type CourseStatusFilter = 'all' | Course['status']

const statusBadge: Record<Course['status'], 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending: 'warning',
  published: 'success',
  rejected: 'destructive',
  cancelled: 'outline',
}

export function AdminCourseApprovalsPage() {
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .courses({ status: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => setCourses(res.data))
      .catch((err) => {
        const message = getErrorMessage(err)
        setError(message)
        toast({ title: 'Could not load courses', description: message, variant: 'error' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const handleApprove = async (course: Course) => {
    try {
      await adminApi.approveCourse(course.id)
      toast({ title: 'Course approved', description: course.title, variant: 'success' })
      load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Approval failed', description: message, variant: 'error' })
    }
  }

  const handlePending = async (course: Course) => {
    try {
      await adminApi.pendingCourse(course.id)
      toast({ title: 'Course moved to pending', description: course.title, variant: 'success' })
      load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Update failed', description: message, variant: 'error' })
    }
  }

  const handleCancel = async (course: Course) => {
    try {
      await adminApi.cancelCourse(course.id)
      toast({ title: 'Course cancelled', description: course.title, variant: 'success' })
      load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Cancel failed', description: message, variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    setDeleting(true)
    try {
      await adminApi.deleteCourse(courseToDelete.id)
      toast({ title: 'Course deleted', description: courseToDelete.title, variant: 'success' })
      setCourses((prev) => prev.filter((item) => item.id !== courseToDelete.id))
      setCourseToDelete(null)
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
        <h1 className="text-2xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">Review approved, pending, cancelled, and draft courses</p>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as CourseStatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="published">Approved</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No courses found.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>
                    by {course.instructor_name} · {course.lesson_count} lessons · {course.enrollment_count} enrolled
                  </CardDescription>
                </div>
                <Badge variant={statusBadge[course.status]} className="w-fit capitalize">
                  {course.status === 'published' ? 'Approved' : course.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{course.description}</p>
              <p className="font-semibold">{course.price === 0 ? 'Free' : `$${course.price}`}</p>

              <div className="flex flex-wrap gap-2">
                {course.status !== 'published' && (
                  <Button size="sm" onClick={() => handleApprove(course)}>
                    <Check className="mr-1 h-4 w-4" />
                    {course.status === 'cancelled' ? 'Verify again' : 'Approve'}
                  </Button>
                )}
                {course.status !== 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => handlePending(course)}>
                    <Clock className="mr-1 h-4 w-4" />
                    Pending
                  </Button>
                )}
                {course.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" onClick={() => handleCancel(course)}>
                    <OctagonX className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  title="Delete course"
                  aria-label={`Delete ${course.title}`}
                  onClick={() => setCourseToDelete(course)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courseToDelete && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Delete course?</CardTitle>
              <CardDescription>
                This will permanently delete &quot;{courseToDelete.title}&quot;. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCourseToDelete(null)} disabled={deleting}>
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
