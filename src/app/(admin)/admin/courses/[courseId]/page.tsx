'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, BookOpen, Trash2, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseForm } from '@/components/admin/CourseForm'

interface Course {
  id: string
  title: string
  description: string | null
  short_description: string | null
  thumbnail_url: string | null
  presentation_video_url: string | null
  instructor_name: string | null
  instructor_bio: string | null
  category: string | null
  tags: string[]
  is_published: boolean
  is_featured: boolean
  is_free: boolean
  chapters: {
    id: string
    chapter_number: number
    title: string
  }[]
}

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al cargar curso')
        }

        setCourse(data.course)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleDelete = async () => {
    if (!confirm('¿Estas seguro de eliminar este curso? Se eliminaran todos los capitulos y materiales.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        router.push('/admin/courses')
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Curso no encontrado'}</p>
        <Link href="/admin/courses">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            Volver a cursos
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-col gap-4 md:flex-row md:items-center md:gap-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses">
            <Button variant="ghost" className="border-1 border-transparent text-slate-400 hover:text-white hover:border-slate-700 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar curso</h1>
            <p className="text-sm text-slate-400">{course.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/admin/courses/${courseId}/chapters`}>
            <Button variant="outline" className="border-indigo-600 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Capitulos ({course.chapters?.length || 0})
            </Button>
          </Link>

          <Link href={`/admin/courses/${courseId}/exam`}>
            <Button variant="outline" className="border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Examen
            </Button>
          </Link>

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
      </div>

      <CourseForm course={course} />
    </div>
  )
}
