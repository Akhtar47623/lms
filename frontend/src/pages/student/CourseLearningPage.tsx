import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoPlayer, LessonSidebar, CourseProgressBar } from '@/components/course/VideoPlayer'
import { coursesApi, enrollmentsApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { CourseDetail, CourseProgress } from '@/types'

export function CourseLearningPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const id = Number(courseId)

  useEffect(() => {
    if (!id) return
    Promise.all([coursesApi.get(id), enrollmentsApi.progress(id)])
      .then(([courseRes, progressRes]) => {
        setCourse(courseRes.data)
        setProgress(progressRes.data)
        const firstIncomplete = courseRes.data.lessons.find(
          (l) => !progressRes.data.lessons.find((p) => p.lesson_id === l.id && p.completed),
        )
        setActiveLessonId(firstIncomplete?.id ?? courseRes.data.lessons[0]?.id ?? null)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  const activeLesson = useMemo(
    () => course?.lessons.find((l) => l.id === activeLessonId) ?? null,
    [course, activeLessonId],
  )

  const lessonProgress = useMemo(() => {
    const map = new Map(progress?.lessons.map((p) => [p.lesson_id, p]) ?? [])
    return map
  }, [progress])

  const lessonsWithStatus = useMemo(
    () =>
      (course?.lessons ?? []).map((l) => ({
        ...l,
        completed: lessonProgress.get(l.id)?.completed ?? false,
      })),
    [course, lessonProgress],
  )

  const handleProgress = useCallback(
    (watchedSeconds: number) => {
      if (!activeLessonId || !id) return
      enrollmentsApi.updateLessonProgress(id, activeLessonId, watchedSeconds).catch(() => {})
    },
    [id, activeLessonId],
  )

  const handleComplete = useCallback(() => {
    if (!progress || !course) return
    setProgress({
      ...progress,
      lessons: progress.lessons.map((p) =>
        p.lesson_id === activeLessonId ? { ...p, completed: true } : p,
      ),
      progress_percent: Math.min(
        100,
        Math.round(
          ((progress.lessons.filter((p) => p.completed).length + 1) / course.lessons.length) * 100,
        ),
      ),
    })
  }, [progress, course, activeLessonId])

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading course...</div>
  }

  if (error || !course) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-destructive">{error || 'Course not found'}</p>
        <Button asChild variant="outline"><Link to="/student/courses">Back to my courses</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/student/courses"><ArrowLeft className="mr-1 h-4 w-4" />My courses</Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.instructor_name}</p>
        </div>
      </div>

      <CourseProgressBar percent={progress?.progress_percent ?? 0} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {activeLesson && (
            <>
              <VideoPlayer
                src={activeLesson.video_url ?? ''}
                title={activeLesson.title}
                initialPosition={lessonProgress.get(activeLesson.id)?.watched_seconds ?? 0}
                onProgress={handleProgress}
                onComplete={handleComplete}
              />
              <div>
                <h2 className="text-lg font-semibold">{activeLesson.title}</h2>
                {activeLesson.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{activeLesson.description}</p>
                )}
                {activeLesson.document_url && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href={activeLesson.document_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Download material
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}

          {course.quizzes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4" />
                  Course Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between">
                    <span className="text-sm">{quiz.title}</span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/student/courses/${id}/quiz/${quiz.id}`}>Take quiz</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonSidebar
              lessons={lessonsWithStatus}
              activeLessonId={activeLessonId ?? undefined}
              onSelect={setActiveLessonId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
