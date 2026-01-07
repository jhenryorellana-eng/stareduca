'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChapterForm } from '@/components/admin/ChapterForm'
import { MaterialsEditor } from '@/components/admin/MaterialsEditor'

interface Material {
  id: string
  material_type: 'video' | 'text' | 'pdf' | 'link' | 'download'
  title: string
  description: string | null
  content: string | null
  file_url: string | null
  file_size: number | null
  order_index: number
}

interface Chapter {
  id: string
  chapter_number: number
  title: string
  description: string | null
  video_url: string | null
  video_duration_seconds: number
  is_free_preview: boolean
  chapter_materials: Material[]
}

export default function EditChapterPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const chapterId = params.chapterId as string

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'materials'>('info')

  const fetchChapter = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar capitulo')
      }

      setChapter(data.chapter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChapter()
  }, [courseId, chapterId])

  const handleDelete = async () => {
    if (!confirm('¿Estas seguro de eliminar este capitulo? Se eliminaran todos los materiales.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/admin/courses/${courseId}/chapters`)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const handleMaterialsChange = () => {
    fetchChapter()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Capitulo no encontrado'}</p>
        <Link href={`/admin/courses/${courseId}/chapters`}>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            Volver a capitulos
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${courseId}/chapters`}>
            <Button variant="ghost" className="border-1 border-transparent text-slate-400 hover:text-white hover:border-slate-700 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar capitulo {chapter.chapter_number}</h1>
            <p className="text-sm text-slate-400">{chapter.title}</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="border-red-600 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Eliminar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50 w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'info'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Informacion
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'materials'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Materiales ({chapter.chapter_materials?.length || 0})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'info' ? (
        <ChapterForm courseId={courseId} chapter={chapter} />
      ) : (
        <MaterialsEditor
          courseId={courseId}
          chapterId={chapterId}
          materials={chapter.chapter_materials || []}
          onUpdate={handleMaterialsChange}
        />
      )}
    </div>
  )
}
