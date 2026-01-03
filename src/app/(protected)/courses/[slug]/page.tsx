'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Play,
  CheckCircle,
  Loader2,
  User,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ChapterList } from '@/components/courses/ChapterList'
import { formatDuration } from '@/lib/constants'

interface Chapter {
  id: string
  title: string
  description: string
  order_index: number
  video_url: string
  video_duration_seconds: number
  is_free: boolean
  chapter_materials: Array<{
    id: string
    title: string
    type: string
    url: string
    content: string
  }>
  progress: {
    completed: boolean
    progressPercent: number
    lastPosition: number
  }
}

interface Course {
  id: string
  slug: string
  title: string
  description: string
  long_description: string
  thumbnail_url: string | null
  instructor_name: string
  instructor_avatar_url: string | null
  instructor_bio: string
  total_chapters: number
  total_duration_seconds: number
  difficulty_level: string
  chapters: Chapter[]
  progress: {
    completedChapters: number
    totalChapters: number
    percent: number
    currentChapterId: string | null
  }
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const difficultyLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${slug}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al cargar el curso')
        }

        setCourse(data.course)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCourse()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-400 mb-4">{error || 'Curso no encontrado'}</p>
        <Button onClick={() => router.push('/courses')}>
          Volver a cursos
        </Button>
      </div>
    )
  }

  const isCompleted = course.progress.percent === 100
  const isStarted = course.progress.percent > 0
  const currentChapter = course.chapters.find(c => c.id === course.progress.currentChapterId)
    || course.chapters[0]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/courses')}
        className="text-slate-400 hover:text-white -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a cursos
      </Button>

      {/* Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Course info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
                <BookOpen className="h-16 w-16 text-slate-500" />
              </div>
            )}

            {/* Play button overlay */}
            {currentChapter && (
              <Link
                href={`/courses/${slug}/${currentChapter.id}`}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/50">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
              </Link>
            )}
          </div>

          {/* Title and badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={difficultyColors[course.difficulty_level as keyof typeof difficultyColors] || difficultyColors.beginner}
              >
                {difficultyLabels[course.difficulty_level as keyof typeof difficultyLabels] || 'Principiante'}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-500 text-white border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completado
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <p className="mt-3 text-slate-400">{course.description}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {course.total_chapters} capitulos
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDuration(course.total_duration_seconds)}
            </span>
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {course.progress.completedChapters} de {course.progress.totalChapters} completados
            </span>
          </div>

          {/* Long description */}
          {course.long_description && (
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-3">Acerca del curso</h3>
              <div className="text-slate-400 whitespace-pre-line">
                {course.long_description}
              </div>
            </div>
          )}

          {/* Instructor */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Instructor</h3>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-slate-700 overflow-hidden">
                {course.instructor_avatar_url ? (
                  <img
                    src={course.instructor_avatar_url}
                    alt={course.instructor_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-500" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-white">{course.instructor_name}</h4>
                {course.instructor_bio && (
                  <p className="mt-1 text-sm text-slate-400">{course.instructor_bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chapters and progress */}
        <div className="space-y-6">
          {/* Progress card */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Tu progreso</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Completado</span>
                  <span className="text-sm font-medium text-indigo-400">{course.progress.percent}%</span>
                </div>
                <Progress value={course.progress.percent} className="h-2" />
              </div>
              <p className="text-sm text-slate-500">
                {course.progress.completedChapters} de {course.progress.totalChapters} capitulos
              </p>

              {/* CTA Button */}
              {currentChapter && (
                <Link href={`/courses/${slug}/${currentChapter.id}`}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Play className="h-4 w-4 mr-2" />
                    {isStarted ? 'Continuar' : 'Empezar curso'}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Chapters list */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Contenido del curso</h3>
            <ChapterList
              chapters={course.chapters}
              courseSlug={slug}
              currentChapterId={course.progress.currentChapterId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
