'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
  Video,
  Eye,
  EyeOff,
  Clock,
  FileText,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  description: string | null
  video_url: string | null
  video_duration_seconds: number
  is_free_preview: boolean
  order_index: number
  materials_count: number
  created_at: string
}

interface Course {
  id: string
  title: string
}

export default function ChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchChapters = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/chapters`)
      const data = await response.json()

      if (data.success) {
        setCourse(data.course)
        setChapters(data.chapters)
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChapters()
  }, [courseId])

  const handleTogglePreview = async (chapter: Chapter) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/chapters/${chapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_free_preview: !chapter.is_free_preview })
      })

      const data = await response.json()
      if (data.success) {
        setChapters(prev => prev.map(ch =>
          ch.id === chapter.id ? { ...ch, is_free_preview: !ch.is_free_preview } : ch
        ))
      }
    } catch (error) {
      console.error('Error toggling preview:', error)
    }
  }

  const handleDelete = async (chapterId: string) => {
    if (!confirm('¿Estas seguro de eliminar este capitulo? Se eliminaran todos los materiales.')) return

    setDeleting(chapterId)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setChapters(prev => prev.filter(ch => ch.id !== chapterId))
      }
    } catch (error) {
      console.error('Error deleting chapter:', error)
    } finally {
      setDeleting(null)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${courseId}`}>
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al curso
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Capitulos</h1>
            <p className="text-sm text-slate-400">{course?.title}</p>
          </div>
        </div>
        <Link href={`/admin/courses/${courseId}/chapters/new`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo capitulo
          </Button>
        </Link>
      </div>

      {/* Chapters list */}
      {chapters.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <Video className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hay capitulos</h3>
          <p className="text-slate-400 mb-4">Crea el primer capitulo para este curso</p>
          <Link href={`/admin/courses/${courseId}/chapters/new`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear capitulo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
            >
              {/* Drag handle placeholder */}
              <div className="text-slate-600 cursor-grab">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Chapter number */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <span className="text-indigo-400 font-semibold">{chapter.chapter_number}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{chapter.title}</h3>
                  {chapter.is_free_preview && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      Preview
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  {chapter.video_url && (
                    <span className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      Video
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(chapter.video_duration_seconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {chapter.materials_count} materiales
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href={`/admin/courses/${courseId}/chapters/${chapter.id}`}>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem
                      onClick={() => handleTogglePreview(chapter)}
                      className="cursor-pointer text-slate-300"
                    >
                      {chapter.is_free_preview ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Quitar preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Hacer preview gratuito
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => handleDelete(chapter.id)}
                      disabled={deleting === chapter.id}
                      className="cursor-pointer text-red-400 focus:bg-slate-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {chapters.length > 0 && (
        <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm text-slate-400">
          <span>{chapters.length} capitulos</span>
          <span>
            Duracion total: {formatDuration(chapters.reduce((sum, ch) => sum + (ch.video_duration_seconds || 0), 0))}
          </span>
          <span>
            {chapters.reduce((sum, ch) => sum + ch.materials_count, 0)} materiales
          </span>
        </div>
      )}
    </div>
  )
}
