// ============================================================================
// API: LISTA DE CURSOS
// GET /api/courses
// Retorna todos los cursos publicados con el progreso del estudiante
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyActiveSubscription } from '@/lib/auth/subscriptionCheck'

// Service client para bypasear RLS en nested selects
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    // Obtener cursos publicados con capítulos (usando serviceClient para bypasear RLS)
    const { data: courses, error: coursesError } = await serviceClient
      .from('courses')
      .select(`
        id,
        slug,
        title,
        description,
        short_description,
        thumbnail_url,
        instructor_name,
        is_free,
        category,
        tags,
        created_at,
        chapters (
          id,
          video_duration_seconds
        )
      `)
      .eq('is_published', true)
      .order('order_index', { ascending: true })

    if (coursesError) {
      console.error('Error al obtener cursos:', coursesError)
      return NextResponse.json(
        { error: 'Error al obtener cursos' },
        { status: 500 }
      )
    }

    // Obtener progreso del estudiante para cada curso
    const { data: progress, error: progressError } = await serviceClient
      .from('student_progress')
      .select('course_id, chapters_completed, progress_percentage')
      .eq('student_id', studentId)

    if (progressError) {
      console.error('Error al obtener progreso:', progressError)
    }

    // Crear mapa de progreso por curso
    const progressByCourse = new Map<string, { completed: number; percentage: number }>()

    if (progress) {
      for (const p of progress) {
        progressByCourse.set(p.course_id, {
          completed: p.chapters_completed?.length || 0,
          percentage: p.progress_percentage || 0
        })
      }
    }

    // Combinar cursos con progreso, calculando valores desde capítulos reales
    const coursesWithProgress = courses.map(course => {
      const courseProgress = progressByCourse.get(course.id)
      const completedChapters = courseProgress?.completed || 0

      // Calcular valores desde los capítulos reales
      const chapters = (course as any).chapters || []
      const actualTotalChapters = chapters.length
      const totalDurationSeconds = chapters.reduce(
        (sum: number, ch: any) => sum + (ch.video_duration_seconds || 0),
        0
      )

      const progressPercent = actualTotalChapters > 0
        ? Math.round((completedChapters / actualTotalChapters) * 100)
        : 0

      // Remover chapters del objeto para no enviarlo en la lista
      const { chapters: _, ...courseWithoutChapters } = course as any

      return {
        ...courseWithoutChapters,
        total_chapters: actualTotalChapters,
        total_duration_seconds: totalDurationSeconds,
        progress: {
          completedChapters,
          totalChapters: actualTotalChapters,
          percent: progressPercent,
        }
      }
    })

    return NextResponse.json({
      success: true,
      courses: coursesWithProgress,
    })
  } catch (error) {
    console.error('Error en API cursos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
