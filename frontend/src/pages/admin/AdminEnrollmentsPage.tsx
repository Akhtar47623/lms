import { useEffect, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { Enrollment } from '@/types'

export function AdminEnrollmentsPage() {
  const { toast } = useToast()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .enrollments()
      .then((res) => setEnrollments(res.data))
      .catch((err) => {
        const message = getErrorMessage(err)
        setError(message)
        toast({ title: 'Could not load enrollments', description: message, variant: 'error' })
      })
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = enrollments.filter((enrollment) =>
    enrollment.course_title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enrollments</h1>
          <p className="text-muted-foreground">View platform-wide course enrollments and progress</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by course..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Loading enrollments...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && !loading ? (
            <p className="px-6 py-12 text-center text-muted-foreground">No enrollments found.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((enrollment) => (
                <div key={enrollment.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{enrollment.course_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={enrollment.completed_at ? 'success' : 'secondary'}>
                      {enrollment.completed_at ? 'Completed' : 'In progress'}
                    </Badge>
                    <Badge variant="outline">{enrollment.progress_percent}% progress</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
