// ============================================================================
// API: PROGRESO DE CAPITULO
// POST /api/courses/[slug]/progress
// Actualiza el progreso de un capitulo para el estudiante
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { chapterId, completed, progressPercent, lastPositionSeconds } = body

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

    // Obtener el curso por slug para verificar que existe
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el capitulo pertenece al curso
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id')
      .eq('id', chapterId)
      .eq('course_id', course.id)
      .single()

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Capitulo no encontrado en este curso' },
        { status: 404 }
      )
    }

    // Upsert progreso
    const progressData: {
      student_id: string
      course_id: string
      chapter_id: string
      completed?: boolean
      progress_percent?: number
      last_position_seconds?: number
      updated_at: string
    } = {
      student_id: studentId,
      course_id: course.id,
      chapter_id: chapterId,
      updated_at: new Date().toISOString(),
    }

    if (typeof completed === 'boolean') {
      progressData.completed = completed
    }

    if (typeof progressPercent === 'number') {
      progressData.progress_percent = Math.min(100, Math.max(0, progressPercent))
    }

    if (typeof lastPositionSeconds === 'number') {
      progressData.last_position_seconds = lastPositionSeconds
    }

    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .upsert(progressData, {
        onConflict: 'student_id,chapter_id',
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
