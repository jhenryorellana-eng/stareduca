'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  BookOpen,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
  Loader2,
  Users,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CourseCard } from '@/components/courses/CourseCard'

interface CourseWithProgress {
  id: string
  slug: string
  title: string
  description: string
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

interface DashboardStats {
  totalCourses: number
  coursesInProgress: number
  coursesCompleted: number
  totalProgress: number
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        const data = await response.json()

        if (data.success) {
          setCourses(data.courses)
        }
      } catch (err) {
        console.error('Error fetching courses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Calculate stats
  const stats: DashboardStats = {
    totalCourses: courses.length,
    coursesInProgress: courses.filter(c => c.progress.percent > 0 && c.progress.percent < 100).length,
    coursesCompleted: courses.filter(c => c.progress.percent === 100).length,
    totalProgress: courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + c.progress.percent, 0) / courses.length)
      : 0,
  }

  // Get courses in progress (most recently updated)
  const coursesInProgress = courses
    .filter(c => c.progress.percent > 0 && c.progress.percent < 100)
    .slice(0, 3)

  // Get recommended courses (not started)
  const recommendedCourses = courses
    .filter(c => c.progress.percent === 0)
    .slice(0, 3)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-indigo-100 max-w-xl">
            Continua aprendiendo y alcanza tus metas. Tienes {stats.coursesInProgress} curso{stats.coursesInProgress !== 1 ? 's' : ''} en progreso.
          </p>
          {coursesInProgress.length > 0 && (
            <Link href={`/courses/${coursesInProgress[0].slug}`}>
              <Button className="mt-4 bg-white text-indigo-600 hover:bg-indigo-50">
                <Play className="h-4 w-4 mr-2" />
                Continuar aprendiendo
              </Button>
            </Link>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <GraduationCap className="h-full w-full" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <BookOpen className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalCourses}</p>
              <p className="text-sm text-slate-400">Cursos totales</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.coursesInProgress}</p>
              <p className="text-sm text-slate-400">En progreso</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Award className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.coursesCompleted}</p>
              <p className="text-sm text-slate-400">Completados</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalProgress}%</p>
              <p className="text-sm text-slate-400">Progreso total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses in progress */}
      {coursesInProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Continua donde lo dejaste</h2>
            <Link
              href="/courses?filter=in_progress"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesInProgress.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended courses */}
      {recommendedCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Cursos recomendados</h2>
            <Link
              href="/courses?filter=not_started"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/community"
          className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Comunidad
              </h3>
              <p className="text-sm text-slate-400">
                Conecta con otros estudiantes y comparte tus logros
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 ml-auto transition-colors" />
          </div>
        </Link>

        <Link
          href="/affiliate"
          className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-green-500/30 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                Programa de Afiliados
              </h3>
              <p className="text-sm text-slate-400">
                Gana comisiones invitando a otros estudiantes
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-green-400 ml-auto transition-colors" />
          </div>
        </Link>
      </section>
    </div>
  )
}
