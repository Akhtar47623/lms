import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Video, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { instructorApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'

export function InstructorDashboard() {
  const [stats, setStats] = useState({
    total_courses: 0,
    total_students: 0,
    live_sessions: 0,
    completion_rate: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    instructorApi
      .analytics()
      .then((res) => setStats(res.data))
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const cards = [
    { label: 'My Courses', value: String(stats.total_courses), icon: BookOpen },
    { label: 'Total Students', value: String(stats.total_students), icon: Users },
    { label: 'Live Sessions', value: String(stats.live_sessions), icon: Video },
    { label: 'Completion Rate', value: `${stats.completion_rate}%`, icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and students</p>
        </div>
        <Button asChild>
          <Link to="/instructor/courses/new">Create course</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
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
    </div>
  )
}
