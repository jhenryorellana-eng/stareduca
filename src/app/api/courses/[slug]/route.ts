// ============================================================================
// API: DETALLE DE CURSO
// GET /api/courses/[slug]
// Retorna un curso con todos sus capitulos y progreso del estudiante
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id

    if (!studentId) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Obtener curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        slug,
        title,
        description,
        long_description,
        thumbnail_url,
        instructor_name,
        instructor_avatar_url,
        instructor_bio,
        total_chapters,
        total_duration_seconds,
        difficulty_level,
        status,
        created_at,
        chapters (
          id,
          title,
          description,
          order_index,
          video_url,
          video_duration_seconds,
          is_free,
          chapter_materials (
            id,
            title,
            type,
            url,
            content
          )
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener progreso del estudiante para este curso
    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select('chapter_id, completed, progress_percent, last_position_seconds, updated_at')
      .eq('student_id', studentId)
      .eq('course_id', course.id)

    if (progressError) {
      console.error('Error al obtener progreso:', progressError)
    }

    // Crear mapa de progreso por capitulo
    const progressByChapter = new Map<string, {
      completed: boolean
      progressPercent: number
      lastPosition: number
      updatedAt: string
    }>()

    if (progress) {
      for (const p of progress) {
        progressByChapter.set(p.chapter_id, {
          completed: p.completed,
          progressPercent: p.progress_percent || 0,
          lastPosition: p.last_position_seconds || 0,
          updatedAt: p.updated_at,
        })
      }
    }

    // Ordenar capitulos y agregar progreso
    const chaptersWithProgress = (course.chapters || [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(chapter => {
        const chapterProgress = progressByChapter.get(chapter.id)
        return {
          ...chapter,
          progress: chapterProgress || {
            completed: false,
            progressPercent: 0,
            lastPosition: 0,
            updatedAt: null,
          }
        }
      })

    // Calcular progreso general del curso
    const completedChapters = chaptersWithProgress.filter(c => c.progress.completed).length
    const totalChapters = chaptersWithProgress.length
    const overallProgress = totalChapters > 0
      ? Math.round((completedChapters / totalChapters) * 100)
      : 0

    // Encontrar el ultimo capitulo visto o el primero sin completar
    let currentChapter = chaptersWithProgress.find(c => !c.progress.completed)
    if (!currentChapter && chaptersWithProgress.length > 0) {
      currentChapter = chaptersWithProgress[chaptersWithProgress.length - 1]
    }

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        chapters: chaptersWithProgress,
        progress: {
          completedChapters,
          totalChapters,
          percent: overallProgress,
          currentChapterId: currentChapter?.id || null,
        }
      }
    })
  } catch (error) {
    console.error('Error en API detalle curso:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
