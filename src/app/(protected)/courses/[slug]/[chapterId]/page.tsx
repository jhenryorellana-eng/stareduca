'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  BookOpen,
  List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from '@/components/courses/VideoPlayer'
import { MaterialsList } from '@/components/courses/MaterialsList'
import { ChapterList } from '@/components/courses/ChapterList'
import { cn } from '@/lib/utils'

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
    type: 'pdf' | 'link' | 'text' | 'download' | 'video'
    url: string | null
    content: string | null
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
  chapters: Chapter[]
  progress: {
    completedChapters: number
    totalChapters: number
    percent: number
    currentChapterId: string | null
  }
}

export default function ChapterPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const chapterId = params.chapterId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChapterList, setShowChapterList] = useState(false)
  const [isMarking, setIsMarking] = useState(false)

  const currentChapter = course?.chapters.find(c => c.id === chapterId)
  const currentIndex = course?.chapters.findIndex(c => c.id === chapterId) ?? -1
  const prevChapter = currentIndex > 0 ? course?.chapters[currentIndex - 1] : null
  const nextChapter = currentIndex < (course?.chapters.length ?? 0) - 1
    ? course?.chapters[currentIndex + 1]
    : null

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

  const updateProgress = useCallback(async (progressPercent: number, lastPosition: number) => {
    if (!course) return

    try {
      await fetch(`/api/courses/${slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          progressPercent: Math.round(progressPercent),
          lastPositionSeconds: Math.round(lastPosition),
        }),
      })
    } catch (err) {
      console.error('Error updating progress:', err)
    }
  }, [course, slug, chapterId])

  const markAsCompleted = useCallback(async () => {
    if (!course || isMarking) return

    setIsMarking(true)
    try {
      await fetch(`/api/courses/${slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          completed: true,
          progressPercent: 100,
        }),
      })

      // Actualizar estado local
      setCourse(prev => {
        if (!prev) return prev
        return {
          ...prev,
          chapters: prev.chapters.map(c =>
            c.id === chapterId
              ? { ...c, progress: { ...c.progress, completed: true, progressPercent: 100 } }
              : c
          ),
          progress: {
            ...prev.progress,
            completedChapters: prev.progress.completedChapters + 1,
            percent: Math.round(((prev.progress.completedChapters + 1) / prev.progress.totalChapters) * 100),
          }
        }
      })
    } catch (err) {
      console.error('Error marking as completed:', err)
    } finally {
      setIsMarking(false)
    }
  }, [course, slug, chapterId, isMarking])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !course || !currentChapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-400 mb-4">{error || 'Capitulo no encontrado'}</p>
        <Button onClick={() => router.push(`/courses/${slug}`)}>
          Volver al curso
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${slug}`)}
            className="text-slate-400 hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Volver al curso</span>
          </Button>

          <div className="min-w-0">
            <Link
              href={`/courses/${slug}`}
              className="text-sm text-slate-500 hover:text-indigo-400"
            >
              {course.title}
            </Link>
            <h1 className="text-xl font-bold text-white truncate">
              {currentIndex + 1}. {currentChapter.title}
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowChapterList(!showChapterList)}
          className="flex-shrink-0 border-slate-700 text-slate-300 hover:text-white"
        >
          <List className="h-4 w-4 mr-2" />
          Capitulos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className={cn('space-y-6', showChapterList ? 'lg:col-span-2' : 'lg:col-span-3')}>
          {/* Video Player */}
          <VideoPlayer
            videoUrl={currentChapter.video_url}
            title={currentChapter.title}
            lastPosition={currentChapter.progress.lastPosition}
            onProgress={updateProgress}
            onComplete={markAsCompleted}
          />

          {/* Chapter info */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{currentChapter.title}</h2>
                {currentChapter.description && (
                  <p className="mt-2 text-slate-400">{currentChapter.description}</p>
                )}
              </div>

              {/* Mark as completed button */}
              {!currentChapter.progress.completed && (
                <Button
                  onClick={markAsCompleted}
                  disabled={isMarking}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                >
                  {isMarking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Marcar completado
                </Button>
              )}

              {currentChapter.progress.completed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Completado</span>
                </div>
              )}
            </div>
          </div>

          {/* Materials */}
          {currentChapter.chapter_materials?.length > 0 && (
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <MaterialsList materials={currentChapter.chapter_materials} />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link href={`/courses/${slug}/${prevChapter.id}`}>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextChapter ? (
              <Link href={`/courses/${slug}/${nextChapter.id}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href={`/courses/${slug}`}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar curso
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar: Chapter list */}
        {showChapterList && (
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Contenido</h3>
              <ChapterList
                chapters={course.chapters}
                courseSlug={slug}
                currentChapterId={chapterId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
