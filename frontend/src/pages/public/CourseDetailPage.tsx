import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, Clock, GraduationCap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { coursesApi, enrollmentsApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useAppSelector } from '@/hooks/useAppStore'
import { useToast } from '@/components/ui/toaster'
import type { CourseDetail } from '@/types'

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const { toast } = useToast()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const canEnroll = !isAuthenticated || user?.role === 'student'

  useEffect(() => {
    if (!slug) return
    coursesApi
      .getBySlug(slug)
      .then((res) => setCourse(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [slug])

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!course || user?.role !== 'student') return
    setEnrolling(true)
    try {
      await enrollmentsApi.enroll(course.id)
      toast({
        title: 'Enrollment complete',
        description: `You are now enrolled in ${course.title}.`,
        variant: 'success',
      })
      if (user?.role === 'student') {
        navigate(`/student/courses/${course.id}`)
      }
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Enrollment failed', description: message, variant: 'error' })
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Course not found'}</p>
        <Button asChild variant="outline"><Link to="/courses">Back to catalog</Link></Button>
      </div>
    )
  }

  const totalDuration = course.lessons.reduce((sum, l) => sum + l.duration_seconds, 0)
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold">LMS Platform</span>
          </Link>
          <Button variant="ghost" asChild><Link to="/courses">All courses</Link></Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">{course.status}</Badge>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="mt-2 text-muted-foreground">by {course.instructor_name}</p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{course.description}</p>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {course.lessons.map((lesson, i) => (
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
                ))}
              </CardContent>
            </Card>

            {course.quizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quizzes ({course.quizzes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.quizzes.map((q) => (
                    <div key={q.id} className="flex justify-between py-2 text-sm">
                      <span>{q.title}</span>
                      <span className="text-muted-foreground">Pass: {q.passing_score}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-8">
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

                {canEnroll ? (
                  <Button className="w-full" size="lg" onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Students only
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
