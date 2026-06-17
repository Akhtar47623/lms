import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Video, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { liveClassesApi, instructorApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { Course, LiveClass } from '@/types'

const schema = z.object({
  course_id: z.coerce.number().min(1, 'Select a course'),
  title: z.string().min(3, 'Title required'),
  scheduled_at: z.string().min(1, 'Date required'),
  duration_minutes: z.coerce.number().min(15).max(480),
})

type FormData = z.infer<typeof schema>

export function LiveClassesPage() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [classToDelete, setClassToDelete] = useState<LiveClass | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration_minutes: 60 },
  })

  const load = () => {
    Promise.all([liveClassesApi.list(), instructorApi.myCourses()])
      .then(([classesRes, coursesRes]) => {
        setClasses(classesRes.data)
        setCourses(coursesRes.data)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await liveClassesApi.create(data)
      form.reset({ duration_minutes: 60 })
      setShowForm(false)
      toast({
        title: 'Live class scheduled',
        description: 'The session was added to your live classes.',
        variant: 'success',
      })
      load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Scheduling failed', description: message, variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!classToDelete) return
    setDeleting(true)
    try {
      await liveClassesApi.delete(classToDelete.id)
      setClasses((prev) => prev.filter((c) => c.id !== classToDelete.id))
      toast({ title: 'Live class deleted', description: 'The session was removed.', variant: 'success' })
      setClassToDelete(null)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Classes</h1>
          <p className="text-muted-foreground">Schedule Zoom sessions for your courses</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule class
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Live Class</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Course</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...form.register('course_id')}>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...form.register('title')} placeholder="Week 1 Live Q&A" />
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" {...form.register('scheduled_at')} />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" min={15} max={480} {...form.register('duration_minutes')} />
              </div>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit">Create via Zoom API</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{cls.title}</p>
                    <p className="text-xs text-muted-foreground">{cls.course_title}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete live class"
                  aria-label={`Delete ${cls.title}`}
                  onClick={() => setClassToDelete(cls)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>{new Date(cls.scheduled_at).toLocaleString()}</p>
                <p>{cls.duration_minutes} minutes</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">Zoom</Badge>
                {cls.join_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={cls.join_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Join link
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && classes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No live classes scheduled yet.
          </CardContent>
        </Card>
      )}

      {classToDelete && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Delete live class?</CardTitle>
              <CardDescription>
                This will permanently delete &quot;{classToDelete.title}&quot; from your schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setClassToDelete(null)} disabled={deleting}>
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
