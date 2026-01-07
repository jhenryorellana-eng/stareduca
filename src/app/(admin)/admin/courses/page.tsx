'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  MoreHorizontal,
  Star,
  Clock
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
import { cn } from '@/lib/utils'

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  instructor_name: string | null
  total_chapters: number
  chapters_count: number
  total_duration_minutes: number
  is_published: boolean
  is_featured: boolean
  category: string | null
  created_at: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/admin/courses?${params}`)
      const data = await response.json()

      if (data.success) {
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetchCourses, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleTogglePublish = async (course: Course) => {
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !course.is_published })
      })

      const data = await response.json()
      if (data.success) {
        setCourses(prev => prev.map(c =>
          c.id === course.id ? { ...c, is_published: !c.is_published } : c
        ))
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm('¿Estas seguro de eliminar este curso? Esta accion no se puede deshacer.')) return

    setDeleting(courseId)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setCourses(prev => prev.filter(c => c.id !== courseId))
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    } finally {
      setDeleting(null)
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
        <h1 className="text-2xl font-bold text-white">Cursos</h1>
        <Link href="/admin/courses/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo curso
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cursos..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Courses grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {search ? 'No se encontraron cursos' : 'No hay cursos'}
          </h3>
          <p className="text-slate-400 mb-4">
            {search ? 'Intenta con otra busqueda' : 'Crea tu primer curso para empezar'}
          </p>
          {!search && (
            <Link href="/admin/courses/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Crear curso
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-700">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-slate-500" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {!course.is_published && (
                    <Badge className="bg-amber-500/80 text-white">Borrador</Badge>
                  )}
                  {course.is_featured && (
                    <Badge className="bg-indigo-500/80 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Destacado
                    </Badge>
                  )}
                </div>

                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button size="sm" className="bg-indigo-600/70 hover:bg-indigo-700">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${course.id}/chapters`}>
                    <Button size="sm" variant="outline" className="bg-purple-600/70 border-none text-white  hover:bg-purple-600">
                      Capitulos
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{course.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                      {course.description || 'Sin descripcion'}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/courses/${course.id}`} className="cursor-pointer text-slate-300">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/courses/${course.id}/chapters`} className="cursor-pointer text-slate-300">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Capitulos ({course.chapters_count})
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTogglePublish(course)}
                        className="cursor-pointer text-slate-300"
                      >
                        {course.is_published ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Publicar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        onClick={() => handleDelete(course.id)}
                        disabled={deleting === course.id}
                        className="cursor-pointer text-red-400 focus:bg-slate-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.chapters_count} capitulos
                  </span>
                  {course.instructor_name && (
                    <span className="truncate">
                      {course.instructor_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
