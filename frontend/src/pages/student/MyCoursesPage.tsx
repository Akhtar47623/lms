import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { enrollmentsApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { Enrollment } from '@/types'

export function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    enrollmentsApi
      .list()
      .then((res) => setEnrollments(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Courses you are enrolled in</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/student/catalog">Browse more</Link>
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading courses...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && enrollments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">You haven&apos;t enrolled in any courses yet.</p>
            <Button className="mt-4" asChild>
              <Link to="/student/catalog">Explore courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id}>
            <CardHeader>
              <CardTitle className="text-lg">{enrollment.course_title}</CardTitle>
              <CardDescription>
                Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm">Progress: {enrollment.progress_percent}%</p>
              <Button asChild size="sm">
                <Link to={`/student/courses/${enrollment.course_id}`}>Continue</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
