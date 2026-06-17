import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle, Clock, PlayCircle, ShieldCheck, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { coursesApi, enrollmentsApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { CourseDetail, Enrollment } from '@/types'

export function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const id = Number(courseId)
  const invalidCourseId = !courseId || Number.isNaN(id)

  useEffect(() => {
    if (invalidCourseId) return

    Promise.all([coursesApi.get(id), enrollmentsApi.list()])
      .then(([courseRes, enrollmentsRes]) => {
        setCourse(courseRes.data)
        setEnrollments(enrollmentsRes.data)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, invalidCourseId])

  const enrollment = useMemo(
    () => enrollments.find((item) => item.course_id === id) ?? null,
    [enrollments, id],
  )

  const handleEnroll = async () => {
    if (!course) return
    setEnrolling(true)
    setError('')
    try {
      const res = await enrollmentsApi.enroll(course.id)
      setEnrollments((prev) => {
        const exists = prev.some((item) => item.course_id === res.data.course_id)
        return exists ? prev : [...prev, res.data]
      })
      toast({
        title: 'Enrollment complete',
        description: `You are now enrolled in ${course.title}.`,
        variant: 'success',
      })
      navigate(`/student/courses/${course.id}`)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Enrollment failed', description: message, variant: 'error' })
    } finally {
      setEnrolling(false)
    }
  }

  if (invalidCourseId) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Course not found</p>
        <Button asChild variant="outline">
          <Link to="/student/catalog">Back to catalog</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading course...</p>
  }

  if (error && !course) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link to="/student/catalog">Back to catalog</Link>
        </Button>
      </div>
    )
  }

  if (!course) return null

  const totalDuration = course.lessons.reduce((sum, lesson) => sum + lesson.duration_seconds, 0)
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Button asChild variant="ghost" className="-ml-4">
        <Link to="/student/catalog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Course catalog
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-3">Published</Badge>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="mt-2 text-muted-foreground">by {course.instructor_name}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About this course</CardTitle>
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
              <CardDescription>{course.lessons.length} lessons included</CardDescription>
            </CardHeader>
            <CardContent>
              {course.lessons.map((lesson, i) => (
                <div key={lesson.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
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
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              {course.price === 0 ? 'Free enrollment' : `$${course.price}`}
            </CardTitle>
            <CardDescription>Start learning from your student dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 text-sm text-muted-foreground">
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
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Access lessons after enrollment
              </div>
            </div>

            {enrollment ? (
              <div className="space-y-3 rounded-md border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  You are enrolled
                </div>
                <p className="text-sm text-muted-foreground">Progress: {enrollment.progress_percent}%</p>
                <Button className="w-full" asChild>
                  <Link to={`/student/courses/${course.id}`}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Continue learning
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button className="h-12 w-full text-base" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? 'Enrolling...' : 'Enroll and start learning'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Enrollment adds this course to My Courses immediately.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
