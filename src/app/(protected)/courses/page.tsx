'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Filter, Loader2 } from 'lucide-react'
import { CourseCard } from '@/components/courses/CourseCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CourseWithProgress = {
  id: string
  slug: string
  title: string
  short_description: string | null
  thumbnail_url: string | null
  instructor_name: string
  instructor_avatar_url: string | null
  total_chapters: number
  total_duration_seconds: number
  difficulty_level: string
  progress: {
    completedChapters: number
    totalChapters: number
    percent: number
  }
}

type FilterType = 'all' | 'in_progress' | 'completed' | 'not_started'

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al cargar cursos')
        }

        setCourses(data.courses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const filteredCourses = courses.filter(course => {
    switch (filter) {
      case 'in_progress':
        return course.progress.percent > 0 && course.progress.percent < 100
      case 'completed':
        return course.progress.percent === 100
      case 'not_started':
        return course.progress.percent === 0
      default:
        return true
    }
  })

  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => c.progress.percent > 0 && c.progress.percent < 100).length,
    completed: courses.filter(c => c.progress.percent === 100).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-indigo-500" />
            Cursos
          </h1>
          <p className="mt-1 text-slate-400">
            Explora todos los cursos disponibles y continua aprendiendo
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <span className="text-slate-400">Total: </span>
            <span className="font-medium text-white">{stats.total}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <span className="text-indigo-400">En progreso: </span>
            <span className="font-medium text-indigo-300">{stats.inProgress}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
            <span className="text-green-400">Completados: </span>
            <span className="font-medium text-green-300">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600 text-gray-200">
            Todos
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-indigo-600 text-gray-200">
            En progreso
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-indigo-600 text-gray-200">
            Completados
          </TabsTrigger>
          <TabsTrigger value="not_started" className="data-[state=active]:bg-indigo-600 text-gray-200">
            Sin empezar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No hay cursos en esta categoria
          </h3>
          <p className="text-slate-400 max-w-md">
            {filter === 'all'
              ? 'Aun no hay cursos disponibles. Vuelve pronto.'
              : 'Cambia el filtro para ver otros cursos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
