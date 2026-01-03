'use client'

import Link from 'next/link'
import { Play, CheckCircle, Lock, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/constants'

interface Chapter {
  id: string
  title: string
  description: string
  order_index: number
  video_duration_seconds: number
  is_free: boolean
  chapter_materials: Array<{
    id: string
    title: string
    type: string
  }>
  progress: {
    completed: boolean
    progressPercent: number
    lastPosition: number
  }
}

interface ChapterListProps {
  chapters: Chapter[]
  courseSlug: string
  currentChapterId?: string | null
}

export function ChapterList({ chapters, courseSlug, currentChapterId }: ChapterListProps) {
  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => {
        const isCompleted = chapter.progress.completed
        const isInProgress = chapter.progress.progressPercent > 0 && !isCompleted
        const isCurrent = chapter.id === currentChapterId
        const hasMaterials = chapter.chapter_materials?.length > 0

        return (
          <Link
            key={chapter.id}
            href={`/courses/${courseSlug}/${chapter.id}`}
            className={cn(
              'block p-4 rounded-xl border transition-all group',
              isCurrent
                ? 'bg-indigo-600/20 border-indigo-500/50'
                : isCompleted
                  ? 'bg-slate-800/30 border-slate-700/50 hover:border-green-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/30'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Chapter number / status */}
              <div
                className={cn(
                  'flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold',
                  isCompleted
                    ? 'bg-green-500/20 text-green-400'
                    : isCurrent || isInProgress
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-slate-700/50 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isCurrent || isInProgress ? (
                  <Play className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className={cn(
                      'font-medium truncate',
                      isCompleted
                        ? 'text-slate-300'
                        : isCurrent
                          ? 'text-indigo-400'
                          : 'text-white group-hover:text-indigo-400'
                    )}
                  >
                    {chapter.title}
                  </h4>
                  {chapter.is_free && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      Gratis
                    </span>
                  )}
                </div>

                {chapter.description && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                    {chapter.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(chapter.video_duration_seconds)}
                  </span>
                  {hasMaterials && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {chapter.chapter_materials.length} material{chapter.chapter_materials.length !== 1 ? 'es' : ''}
                    </span>
                  )}
                  {isInProgress && (
                    <span className="text-indigo-400">
                      {chapter.progress.progressPercent}% completado
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar for in-progress chapters */}
              {isInProgress && (
                <div className="flex-shrink-0 w-16">
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${chapter.progress.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
