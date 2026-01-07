'use client'

import Link from 'next/link'
import { Clock, BookOpen, ChevronRight, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatDuration } from '@/lib/constants'

interface CourseCardProps {
  course: {
    id: string
    slug: string
    title: string
    short_description?: string | null
    thumbnail_url?: string | null
    instructor_name: string
    instructor_avatar_url?: string | null
    total_chapters: number
    total_duration_seconds: number
    category?: string | null
    tags?: string[] | null
    progress: {
      completedChapters: number
      totalChapters: number
      percent: number
    }
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const isCompleted = course.progress.percent === 100
  const isStarted = course.progress.percent > 0

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-700">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
            <BookOpen className="h-12 w-12 text-slate-500" />
          </div>
        )}

        {/* Progress overlay */}
        {isStarted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/50">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${course.progress.percent}%` }}
            />
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white border-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          </div>
        )}

        {/* Category badge */}
        {course.category && (
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
            >
              {course.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        {course.short_description && (
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">
            {course.short_description}
          </p>
        )}

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {course.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300"
              >
                {tag}
              </span>
            ))}
            {course.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500">
                +{course.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Instructor */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-700 overflow-hidden">
            {course.instructor_avatar_url ? (
              <img
                src={course.instructor_avatar_url}
                alt={course.instructor_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                {course.instructor_name.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-sm text-slate-400">{course.instructor_name}</span>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.total_chapters} capitulos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(course.total_duration_seconds)}
            </span>
          </div>
        </div>

        {/* Progress */}
        {isStarted && !isCompleted && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Progreso</span>
              <span className="text-xs font-medium text-indigo-400">{course.progress.percent}%</span>
            </div>
            <Progress value={course.progress.percent} className="h-1.5" />
            <p className="mt-1 text-xs text-slate-500">
              {course.progress.completedChapters} de {course.progress.totalChapters} capitulos
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
            {isCompleted ? 'Revisar curso' : isStarted ? 'Continuar' : 'Empezar curso'}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  )
}
