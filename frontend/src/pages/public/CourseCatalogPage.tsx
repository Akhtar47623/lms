import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { coursesApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { Course } from '@/types'

export function CourseCatalogPage() {
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Course Catalog</h1>
          <p className="text-muted-foreground">Browse and enroll in available courses</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="text-muted-foreground">Loading courses...</p>}
        {error && <p className="text-destructive">{error}</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                <CardDescription>
                  {course.instructor_name} · {course.lesson_count} lessons
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                  <Button size="sm" asChild>
                    <Link to={`/courses/${course.slug}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
