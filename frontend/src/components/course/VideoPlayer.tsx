import { useCallback, useEffect, useRef } from 'react'
import { CheckCircle, Play } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  title: string
  initialPosition?: number
  onProgress?: (watchedSeconds: number) => void
  onComplete?: () => void
  className?: string
}

export function VideoPlayer({
  src,
  title,
  initialPosition = 0,
  onProgress,
  onComplete,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastReported = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (initialPosition > 0) video.currentTime = initialPosition
    completedRef.current = false
    lastReported.current = 0
  }, [src, initialPosition])

  const reportProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || !onProgress) return

    const current = Math.floor(video.currentTime)
    if (current - lastReported.current >= 5) {
      lastReported.current = current
      onProgress(current)
    }

    if (!completedRef.current && video.duration > 0 && video.currentTime / video.duration >= 0.9) {
      completedRef.current = true
      onComplete?.()
    }
  }, [onProgress, onComplete])

  if (!src) {
    return (
      <div className={cn('flex aspect-video items-center justify-center rounded-lg bg-muted', className)}>
        <div className="text-center text-muted-foreground">
          <Play className="mx-auto mb-2 h-12 w-12 opacity-40" />
          <p>No video available for this lesson</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-lg bg-black', className)}>
      <video
        ref={videoRef}
        src={src}
        controls
        className="aspect-video w-full"
        title={title}
        onTimeUpdate={reportProgress}
        onEnded={() => {
          onProgress?.(Math.floor(videoRef.current?.duration ?? 0))
          onComplete?.()
        }}
      />
    </div>
  )
}

interface LessonListProps {
  lessons: Array<{
    id: number
    title: string
    duration_seconds: number
    is_preview: boolean
    completed?: boolean
  }>
  activeLessonId?: number
  onSelect: (lessonId: number) => void
}

export function LessonSidebar({ lessons, activeLessonId, onSelect }: LessonListProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-1">
      {lessons.map((lesson, index) => (
        <button
          key={lesson.id}
          type="button"
          onClick={() => onSelect(lesson.id)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
            activeLessonId === lesson.id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent',
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/20 text-xs font-medium">
            {lesson.completed ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              index + 1
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{lesson.title}</p>
            <p className={cn('text-xs', activeLessonId === lesson.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {formatDuration(lesson.duration_seconds)}
              {lesson.is_preview && ' · Preview'}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

interface CourseProgressBarProps {
  percent: number
  label?: string
}

export function CourseProgressBar({ percent, label }: CourseProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label ?? 'Course progress'}</span>
        <span className="font-medium">{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  )
}
