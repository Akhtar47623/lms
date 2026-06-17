import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuizPlayer } from '@/components/quiz/QuizPlayer'
import { quizzesApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import type { Quiz, QuizQuestion } from '@/types'

export function QuizPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const qId = Number(quizId)
    if (!qId) return
    Promise.all([quizzesApi.get(qId), quizzesApi.getQuestions(qId)])
      .then(([quizRes, questionsRes]) => {
        setQuiz(quizRes.data)
        setQuestions(questionsRes.data)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [quizId])

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading quiz...</div>
  }

  if (error || !quiz) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-destructive">{error || 'Quiz not found'}</p>
        <Button asChild variant="outline">
          <Link to={`/student/courses/${courseId}`}>Back to course</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/student/courses/${courseId}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to course
        </Link>
      </Button>

      <QuizPlayer
        quizTitle={quiz.title}
        passingScore={quiz.passing_score}
        questions={questions}
        onSubmit={(answers) => quizzesApi.submit(Number(quizId), { answers }).then((r) => r.data)}
        onFinish={() => {}}
      />
    </div>
  )
}
