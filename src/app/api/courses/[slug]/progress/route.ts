// ============================================================================
// API: PROGRESO DE CAPITULO
// POST /api/courses/[slug]/progress
// Actualiza el progreso de un capitulo para el estudiante
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { chapterId, completed, lastPositionSeconds } = body

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId es requerido' },
        { status: 400 }
      )
    }

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

    // Obtener el curso por slug con sus capítulos
    const { data: course, error: courseError } = await serviceClient
      .from('courses')
      .select('id, chapters(id)')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const totalChapters = course.chapters?.length || 0

    // Verificar que el capitulo pertenece al curso
    const chapterBelongsToCourse = course.chapters?.some((ch: any) => ch.id === chapterId)
    if (!chapterBelongsToCourse) {
      return NextResponse.json(
        { error: 'Capitulo no encontrado en este curso' },
        { status: 404 }
      )
    }

    // Obtener progreso actual del estudiante para este curso
    const { data: existingProgress } = await serviceClient
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', course.id)
      .single()

    // Preparar datos de actualización
    const updateData: Record<string, any> = {
      current_chapter_id: chapterId,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Si hay posición del video
    if (typeof lastPositionSeconds === 'number') {
      updateData.last_watched_position_seconds = lastPositionSeconds
    }

    // Si marca como completado
    if (completed === true) {
      const currentCompleted: string[] = existingProgress?.chapters_completed || []

      // Agregar chapterId si no está ya en el array
      if (!currentCompleted.includes(chapterId)) {
        currentCompleted.push(chapterId)
      }

      updateData.chapters_completed = currentCompleted

      // Calcular porcentaje de progreso
      updateData.progress_percentage = totalChapters > 0
        ? Math.round((currentCompleted.length / totalChapters) * 100)
        : 0

      // Si completó todos los capítulos, marcar completed_at
      if (currentCompleted.length >= totalChapters) {
        updateData.completed_at = new Date().toISOString()
      }
    }

    // Upsert el progreso
    const { data: progress, error: progressError } = await serviceClient
      .from('student_progress')
      .upsert({
        student_id: studentId,
        course_id: course.id,
        ...updateData,
      }, {
        onConflict: 'student_id,course_id',
      })
      .select()
      .single()

    if (progressError) {
      console.error('Error al actualizar progreso:', progressError)
      return NextResponse.json(
        { error: 'Error al actualizar progreso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress,
    })
  } catch (error) {
    console.error('Error en API progreso:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
