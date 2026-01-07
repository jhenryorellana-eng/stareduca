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
  Clock,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface SortableChapterItemProps {
  chapter: Chapter
  courseId: string
  deleting: string | null
  onDelete: (id: string) => void
  formatDuration: (seconds: number) => string
}

function SortableChapterItem({ chapter, courseId, deleting, onDelete, formatDuration }: SortableChapterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors"
      >
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
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-300 bg-amber-300/40 hover:bg-amber-300">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(chapter.id)}
          disabled={deleting === chapter.id}
          className="border-red-400 text-red-400 bg-red-400/40 hover:bg-red-400"
        >
          {deleting === chapter.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default function ChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  // Sensors para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = chapters.findIndex(ch => ch.id === active.id)
    const newIndex = chapters.findIndex(ch => ch.id === over.id)

    // Actualizar estado local (optimistic update)
    const newChapters = arrayMove(chapters, oldIndex, newIndex).map((ch, idx) => ({
      ...ch,
      order_index: idx + 1,
      chapter_number: idx + 1,
    }))

    setChapters(newChapters)
    setReordering(true)

    try {
      const chaptersData = newChapters.map(ch => ({
        id: ch.id,
        order_index: ch.order_index,
        chapter_number: ch.chapter_number,
      }))
      console.log('Enviando reorder:', chaptersData)

      const response = await fetch(`/api/admin/courses/${courseId}/chapters/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: chaptersData })
      })

      const data = await response.json()
      console.log('Respuesta reorder:', data)

      if (!data.success) {
        console.error('Error en reorder:', data.error)
        // Revertir si falla
        fetchChapters()
      }
    } catch (error) {
      console.error('Error reordering chapters:', error)
      fetchChapters()
    } finally {
      setReordering(false)
    }
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
            <Button variant="ghost" className="border-1 border-transparent text-slate-400 hover:text-white hover:border-slate-700 hover:bg-transparent">
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map(ch => ch.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <SortableChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  courseId={courseId}
                  deleting={deleting}
                  onDelete={handleDelete}
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
