import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Award, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { enrollmentsApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { Enrollment } from '@/types'

export function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    enrollmentsApi
      .list()
      .then((res) => setEnrollments(res.data))
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const completed = enrollments.filter((e) => e.completed_at).length
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress_percent, 0) / enrollments.length)
    : 0
  const inProgress = enrollments.filter((e) => e.progress_percent > 0 && !e.completed_at)

  const stats = [
    { label: 'Enrolled Courses', value: String(enrollments.length), icon: BookOpen },
    { label: 'Completed', value: String(completed), icon: Award },
    { label: 'Avg. Progress', value: `${avgProgress}%`, icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Track your learning progress</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Continue Learning</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/student/courses">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active courses. <Link to="/courses" className="text-primary hover:underline">Browse catalog</Link>
            </p>
          ) : (
            inProgress.slice(0, 3).map((e) => (
              <div key={e.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Link to={`/student/courses/${e.course_id}`} className="font-medium hover:underline">
                    {e.course_title}
                  </Link>
                  <span className="text-muted-foreground">{e.progress_percent}%</span>
                </div>
                <Progress value={e.progress_percent} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
