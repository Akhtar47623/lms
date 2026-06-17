import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { coursesApi, lessonsApi } from '@/services/api'
import { getErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/toaster'
import type { CourseDetail } from '@/types'

const lessonSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  video_url: z.union([z.string().url(), z.literal('')]).optional(),
  duration_seconds: z.coerce.number().min(1, 'Duration required'),
  is_preview: z.boolean(),
})

const courseInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0),
})

const courseSchema = courseInfoSchema.extend({
  lessons: z.array(lessonSchema).min(1, 'Add at least one lesson'),
})

type CourseForm = z.infer<typeof courseSchema>

const STEPS = ['Course Info', 'Lessons', 'Review']

export function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const id = Number(courseId)
  const invalidCourseId = !courseId || Number.isNaN(id)

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      lessons: [{ title: '', description: '', video_url: '', duration_seconds: 300, is_preview: false }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lessons', keyName: 'fieldId' })
  const originalLessonIds = useMemo(() => new Set(course?.lessons.map((lesson) => lesson.id) ?? []), [course])
  const reviewTitle = useWatch({ control: form.control, name: 'title' })
  const reviewDescription = useWatch({ control: form.control, name: 'description' })
  const reviewPrice = useWatch({ control: form.control, name: 'price' })
  const reviewLessons = useWatch({ control: form.control, name: 'lessons' })

  useEffect(() => {
    if (invalidCourseId) return

    coursesApi
      .get(id)
      .then((res) => {
        setCourse(res.data)
        form.reset({
          title: res.data.title,
          description: res.data.description,
          price: res.data.price,
          lessons: res.data.lessons.length > 0
            ? res.data.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description ?? '',
                video_url: lesson.video_url ?? '',
                duration_seconds: lesson.duration_seconds,
                is_preview: lesson.is_preview,
              }))
            : [{ title: '', description: '', video_url: '', duration_seconds: 300, is_preview: false }],
        })
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, invalidCourseId, form])

  const nextStep = () => {
    setError('')

    if (step === 0) {
      form.clearErrors(['title', 'description', 'price'])
      const result = courseInfoSchema.safeParse({
        title: form.getValues('title'),
        description: form.getValues('description'),
        price: form.getValues('price'),
      })

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = issue.path[0]
          if (field === 'title' || field === 'description' || field === 'price') {
            form.setError(field, { message: issue.message })
          }
        })
        return
      }

      setStep(1)
    } else if (step === 1) {
      form.clearErrors('lessons')
      const result = z.array(lessonSchema).min(1, 'Add at least one lesson').safeParse(form.getValues('lessons'))

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const [index, field] = issue.path
          if (typeof index === 'number' && typeof field === 'string') {
            form.setError(`lessons.${index}.${field}` as FieldPath<CourseForm>, { message: issue.message })
          } else {
            setError(issue.message)
          }
        })
        return
      }

      setStep(2)
    }
  }

  const onSubmit = async (data: CourseForm) => {
    if (!course) return
    setSaving(true)
    setError('')

    try {
      await coursesApi.update(course.id, {
        title: data.title,
        description: data.description,
        price: data.price,
      })

      const submittedExistingIds = new Set(data.lessons.map((lesson) => lesson.id).filter(Boolean))
      for (const lessonId of originalLessonIds) {
        if (!submittedExistingIds.has(lessonId)) {
          await lessonsApi.delete(course.id, lessonId)
        }
      }

      for (const lesson of data.lessons) {
        const payload = {
          title: lesson.title,
          description: lesson.description,
          video_url: lesson.video_url || undefined,
          duration_seconds: lesson.duration_seconds,
          is_preview: lesson.is_preview,
        }

        if (lesson.id) {
          await lessonsApi.update(course.id, lesson.id, payload)
        } else {
          await lessonsApi.create(course.id, payload)
        }
      }

      toast({ title: 'Course updated', description: data.title, variant: 'success' })
      navigate('/instructor/courses')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: 'Could not update course', description: message, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (invalidCourseId) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Course not found</p>
        <Button asChild variant="outline">
          <Link to="/instructor/courses">Back to courses</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading course...</p>
  }

  if (error && !course) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link to="/instructor/courses">Back to courses</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" className="-ml-4">
            <Link to="/instructor/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My courses
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
        {course && (
          <Button asChild variant="outline">
            <Link to={`/instructor/courses/${course.id}/view`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Update the basic details about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input id="title" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={5} {...form.register('description')} />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD, 0 = free)</Label>
                <Input id="price" type="number" min={0} step={0.01} {...form.register('price')} />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.fieldId}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Lesson {index + 1}</CardTitle>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input type="hidden" {...form.register(`lessons.${index}.id`, { valueAsNumber: true })} />
                  <Input placeholder="Lesson title" {...form.register(`lessons.${index}.title`)} />
                  {form.formState.errors.lessons?.[index]?.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lessons[index]?.title?.message}
                    </p>
                  )}
                  <Textarea placeholder="Description (optional)" rows={2} {...form.register(`lessons.${index}.description`)} />
                  <Input placeholder="Video URL" {...form.register(`lessons.${index}.video_url`)} />
                  {form.formState.errors.lessons?.[index]?.video_url && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lessons[index]?.video_url?.message}
                    </p>
                  )}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Duration (seconds)</Label>
                      <Input type="number" min={1} {...form.register(`lessons.${index}.duration_seconds`)} />
                      {form.formState.errors.lessons?.[index]?.duration_seconds && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.lessons[index]?.duration_seconds?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <input type="checkbox" id={`preview-${index}`} {...form.register(`lessons.${index}.is_preview`)} />
                      <Label htmlFor={`preview-${index}`}>Free preview</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ title: '', description: '', video_url: '', duration_seconds: 300, is_preview: false })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add lesson
            </Button>
          </div>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Save</CardTitle>
              <CardDescription>Save your changes when everything looks right</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{reviewTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{reviewDescription}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">
                  {Number(reviewPrice) === 0 ? 'Free' : `$${reviewPrice}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons</p>
                <p className="font-medium">{reviewLessons.length} lessons</p>
                <ul className="mt-2 space-y-1">
                  {reviewLessons.map((lesson, i) => (
                    <li key={`${lesson.id ?? 'new'}-${i}`} className="text-sm">{i + 1}. {lesson.title}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-between mt-4">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
