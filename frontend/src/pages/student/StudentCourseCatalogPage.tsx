import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { coursesApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { Course } from '@/types'

export function StudentCourseCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    coursesApi
      .list({ search, status: 'published' })
      .then((res) => setCourses(res.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Catalog</h1>
          <p className="text-muted-foreground">Browse available courses and enroll from your student portal</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Loading courses...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                <Badge variant="secondary">{course.price === 0 ? 'Free' : `$${course.price}`}</Badge>
              </div>
              <CardDescription>{course.instructor_name}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.lesson_count} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrollment_count} enrolled
                </span>
              </div>
              <Button className="mt-5 w-full" asChild>
                <Link to={`/student/catalog/${course.id}`}>View and enroll</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No courses found.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
