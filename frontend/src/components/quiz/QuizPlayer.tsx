import { useState } from 'react'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import type { QuizQuestion, QuizResult } from '@/types'

interface QuizPlayerProps {
  quizTitle: string
  passingScore: number
  questions: QuizQuestion[]
  onSubmit: (answers: Record<number, number>) => Promise<QuizResult>
  onFinish: (result: QuizResult) => void
}

export function QuizPlayer({ quizTitle, passingScore, questions, onSubmit, onFinish }: QuizPlayerProps) {
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  const current = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  const selectAnswer = (optionIndex: number) => {
    if (!current || result) return
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (answeredCount < questions.length) return
    setSubmitting(true)
    try {
      const res = await onSubmit(answers)
      setResult(res)
      onFinish(res)
      toast({
        title: res.passed ? 'Quiz passed' : 'Quiz submitted',
        description: `You scored ${res.score}% on ${quizTitle}.`,
        variant: res.passed ? 'success' : 'info',
      })
    } catch {
      toast({
        title: 'Quiz submission failed',
        description: 'Please try submitting again.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          {result.passed ? (
            <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="mb-4 h-16 w-16 text-destructive" />
          )}
          <h2 className="text-2xl font-bold">
            {result.passed ? 'Congratulations!' : 'Keep trying!'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            You scored {result.score}% ({result.correct_count}/{result.total_count} correct)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Passing score: {passingScore}%
          </p>
          {!result.passed && (
            <Button className="mt-6" onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0) }}>
              Retry Quiz
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{quizTitle}</h1>
        <p className="text-muted-foreground">
          Question {currentIndex + 1} of {questions.length} · Passing score: {passingScore}%
        </p>
        <Progress value={progress} className="mt-3" />
      </div>

      {current && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{current.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {current.options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectAnswer(idx)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors',
                  answers[current.id] === idx
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent',
                )}
              >
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  answers[current.id] === idx && 'border-primary bg-primary text-primary-foreground',
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            disabled={current && answers[current.id] === undefined}
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={answeredCount < questions.length || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>
    </div>
  )
}
