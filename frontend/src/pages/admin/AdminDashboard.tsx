import { useEffect, useState } from 'react'
import { Users, BookOpen, Award, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { adminApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    active_courses: 0,
    certificates_issued: 0,
    growth_percent: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .stats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const cards = [
    { label: 'Total Users', value: String(stats.total_users), icon: Users },
    { label: 'Active Courses', value: String(stats.active_courses), icon: BookOpen },
    { label: 'Certificates Issued', value: String(stats.certificates_issued), icon: Award },
    { label: 'Platform Growth', value: `${stats.growth_percent}%`, icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Course Approvals</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/courses">Review all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Review instructor-submitted courses awaiting approval.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
