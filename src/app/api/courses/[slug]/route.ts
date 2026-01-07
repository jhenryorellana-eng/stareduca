// ============================================================================
// API: DETALLE DE CURSO
// GET /api/courses/[slug]
// Retorna un curso con todos sus capitulos y progreso del estudiante
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Service client para bypasear RLS en nested selects
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Obtener curso por slug (usando serviceClient para bypasear RLS en chapters)
    const { data: course, error: courseError } = await serviceClient
      .from('courses')
      .select(`
        id,
        slug,
        title,
        description,
        short_description,
        thumbnail_url,
        presentation_video_url,
        instructor_name,
        instructor_bio,
        total_chapters,
        total_duration_minutes,
        is_published,
        is_free,
        category,
        tags,
        created_at,
        chapters (
          id,
          title,
          description,
          order_index,
          video_url,
          video_duration_seconds,
          is_free_preview,
          chapter_materials (
            id,
            type,
            title,
            content,
            file_url
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener progreso del estudiante para este curso
    const { data: progress, error: progressError } = await serviceClient
      .from('student_progress')
      .select('current_chapter_id, chapters_completed, progress_percentage, last_watched_position_seconds, updated_at')
      .eq('student_id', studentId)
      .eq('course_id', course.id)
      .single()

    if (progressError && progressError.code !== 'PGRST116') {
      // PGRST116 = no rows found (normal para nuevo estudiante)
      console.error('Error al obtener progreso:', progressError)
    }

    // Set de capitulos completados para busqueda rapida
    const completedChapterIds = new Set<string>(progress?.chapters_completed || [])

    // Ordenar capitulos y agregar progreso
    const chaptersWithProgress = (course.chapters || [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(chapter => {
        const isCompleted = completedChapterIds.has(chapter.id)
        const isCurrent = progress?.current_chapter_id === chapter.id

        // Mapear materiales: type -> material_type para el frontend
        const materials = ((chapter as any).chapter_materials || []).map((m: any) => ({
          ...m,
          type: m.type, // Mantener type para MaterialsList
          url: m.file_url // Mapear file_url a url que espera el componente
        }))

        return {
          ...chapter,
          chapter_materials: materials,
          progress: {
            completed: isCompleted,
            progressPercent: isCompleted ? 100 : (isCurrent ? (progress?.progress_percentage || 0) : 0),
            lastPosition: isCurrent ? (progress?.last_watched_position_seconds || 0) : 0,
            updatedAt: isCurrent ? progress?.updated_at : null,
          }
        }
      })

    // Calcular valores desde los capítulos reales (no usar valores cacheados de courses)
    const actualTotalChapters = chaptersWithProgress.length
    const totalDurationSeconds = chaptersWithProgress.reduce(
      (sum, ch) => sum + (ch.video_duration_seconds || 0),
      0
    )

    // Calcular progreso general del curso
    const completedChapters = chaptersWithProgress.filter(c => c.progress.completed).length
    const overallProgress = actualTotalChapters > 0
      ? Math.round((completedChapters / actualTotalChapters) * 100)
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
        total_chapters: actualTotalChapters,
        total_duration_seconds: totalDurationSeconds,
        chapters: chaptersWithProgress,
        progress: {
          completedChapters,
          totalChapters: actualTotalChapters,
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
