import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { instructorApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { User } from '@/types'

export function InstructorStudentsPage() {
  const [students, setStudents] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    instructorApi
      .students()
      .then((res) => setStudents(res.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-muted-foreground">Students enrolled in your courses</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && !loading ? (
            <p className="px-6 py-12 text-center text-muted-foreground">No students found.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((student) => (
                <div key={student.id} className="flex items-center gap-4 px-6 py-4">
                  <Avatar>
                    <AvatarImage src={student.avatar_url} />
                    <AvatarFallback>
                      {student.first_name[0]}{student.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <Badge variant={student.is_verified ? 'success' : 'warning'}>
                    {student.is_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
