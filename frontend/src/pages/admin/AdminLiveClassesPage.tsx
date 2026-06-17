import { useEffect, useState } from 'react'
import { ExternalLink, Trash2, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { LiveClass } from '@/types'

export function AdminLiveClassesPage() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [classToDelete, setClassToDelete] = useState<LiveClass | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminApi
      .liveClasses()
      .then((res) => setClasses(res.data))
      .catch((err) => {
        const message = getErrorMessage(err)
        setError(message)
        toast({ title: 'Could not load live classes', description: message, variant: 'error' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!classToDelete) return
    setDeleting(true)
    try {
      await adminApi.deleteLiveClass(classToDelete.id)
      setClasses((prev) => prev.filter((item) => item.id !== classToDelete.id))
      toast({ title: 'Live class deleted', description: classToDelete.title, variant: 'success' })
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
      <div>
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-muted-foreground">View and manage all scheduled Zoom sessions</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading live classes...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Video className="h-4 w-4 text-primary" />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.course_title}</CardDescription>
                </div>
                <Badge variant="secondary">Zoom</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{new Date(item.scheduled_at).toLocaleString()}</p>
                <p>{item.duration_minutes} minutes</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.join_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={item.join_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Join
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => setClassToDelete(item)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && classes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No live classes scheduled.
          </CardContent>
        </Card>
      )}

      {classToDelete && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Delete live class?</CardTitle>
              <CardDescription>
                This will permanently delete &quot;{classToDelete.title}&quot; from the platform schedule.
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
