import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, Clock, Pencil, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { coursesApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { CourseDetail } from '@/types'

export function InstructorCourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const id = Number(courseId)
  const invalidCourseId = !courseId || Number.isNaN(id)

  useEffect(() => {
    if (invalidCourseId) return

    coursesApi
      .get(id)
      .then((res) => setCourse(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, invalidCourseId])

  if (invalidCourseId) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Course not found</p>
        <Button asChild variant="outline">
          <Link to="/instructor/courses">Back to courses</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading course...</p>
  }

  if (error || !course) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || 'Course not found'}</p>
        <Button asChild variant="outline">
          <Link to="/instructor/courses">Back to courses</Link>
        </Button>
      </div>
    )
  }

  const totalDuration = course.lessons.reduce((sum, lesson) => sum + lesson.duration_seconds, 0)
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="secondary" className="mb-3 capitalize">{course.status}</Badge>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">by {course.instructor_name}</p>
        </div>
        <Button asChild>
          <Link to={`/instructor/courses/${course.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit course
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">{course.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lessons added yet.</p>
              ) : (
                course.lessons.map((lesson, i) => (
                  <div key={lesson.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{lesson.title}</p>
                          {lesson.is_preview && <Badge variant="outline" className="mt-1">Preview</Badge>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(lesson.duration_seconds / 60)} min
                      </span>
                    </div>
                    {i < course.lessons.length - 1 && <Separator />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            <div className="text-3xl font-bold">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {course.lesson_count} lessons
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {hours > 0 ? `${hours}h ` : ''}{minutes}m total
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {course.enrollment_count} students enrolled
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
