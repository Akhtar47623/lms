import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Plus, BookOpen, Eye, Pencil, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { coursesApi, instructorApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { Course } from '@/types'

const statusVariant: Record<Course['status'], 'default' | 'secondary' | 'warning' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending: 'warning',
  published: 'default',
  rejected: 'destructive',
  cancelled: 'outline',
}

export function InstructorCoursesPage() {
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    instructorApi
      .myCourses()
      .then((res) => setCourses(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!courseToDelete) return
    setDeleting(true)
    setError('')
    try {
      await coursesApi.delete(courseToDelete.id)
      setCourses((prev) => prev.filter((course) => course.id !== courseToDelete.id))
      toast({ title: 'Course deleted', description: courseToDelete.title, variant: 'success' })
      setCourseToDelete(null)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Could not delete course', description: message, variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const refreshCourse = (updated: Course) => {
    setCourses((prev) => prev.map((course) => (course.id === updated.id ? updated : course)))
  }

  const handleSubmitForApproval = async (course: Course) => {
    setError('')
    try {
      await coursesApi.submitForApproval(course.id)
      refreshCourse({ ...course, status: 'pending' })
      toast({ title: 'Course submitted', description: course.title, variant: 'success' })
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Could not submit course', description: message, variant: 'error' })
    }
  }

  const handleArchive = async (course: Course) => {
    if (!confirm(`Archive "${course.title}"? Students will no longer see it as active.`)) return
    setError('')
    try {
      await coursesApi.archive(course.id)
      refreshCourse({ ...course, status: 'cancelled' })
      toast({ title: 'Course archived', description: course.title, variant: 'success' })
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Could not archive course', description: message, variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Create and manage your courses</p>
        </div>
        <Button asChild>
          <Link to="/instructor/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New course
          </Link>
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && courses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No courses created yet.</p>
            <Button className="mt-4" asChild>
              <Link to="/instructor/courses/new">Create your first course</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                <Badge variant={statusVariant[course.status]}>{course.status}</Badge>
              </div>
              <CardDescription>{course.lesson_count} lessons &middot; {course.enrollment_count} students</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
              <p className="mt-3 font-semibold">
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="icon" variant="outline" title="View course">
                  <Link to={`/instructor/courses/${course.id}/view`} aria-label={`View ${course.title}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="outline" title="Edit course">
                  <Link to={`/instructor/courses/${course.id}/edit`} aria-label={`Edit ${course.title}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                {course.status !== 'pending' && course.status !== 'published' && (
                  <Button
                    size="icon"
                    variant="outline"
                    title="Submit for approval"
                    aria-label={`Submit ${course.title} for approval`}
                    onClick={() => handleSubmitForApproval(course)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                {course.status !== 'cancelled' && (
                  <Button
                    size="icon"
                    variant="outline"
                    title="Archive course"
                    aria-label={`Archive ${course.title}`}
                    onClick={() => handleArchive(course)}
                  >
                    <Archive className="h-4 w-4" />
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
                This will permanently delete &quot;{courseToDelete.title}&quot; and its lessons, enrollments, live classes, and certificates.
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
