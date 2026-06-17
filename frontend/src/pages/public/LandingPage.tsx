import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Users, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold">LMS Platform</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Learn, teach, and grow — all in one place
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A full-featured learning management system with video lessons, live Zoom classes,
            quizzes, progress tracking, and certificate generation.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">Start learning</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Video, title: 'Video Learning', desc: 'Watch lessons with progress tracking' },
              { icon: BookOpen, title: 'Quizzes', desc: 'Test knowledge with built-in assessments' },
              { icon: Users, title: 'Live Classes', desc: 'Join Zoom sessions with instructors' },
              { icon: GraduationCap, title: 'Certificates', desc: 'Earn PDF certificates on completion' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border bg-background p-6">
                <Icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
