// ============================================================================
// API: LISTA DE CURSOS
// GET /api/courses
// Retorna todos los cursos publicados con el progreso del estudiante
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
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

    // Obtener cursos publicados
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        slug,
        title,
        description,
        thumbnail_url,
        instructor_name,
        instructor_avatar_url,
        total_chapters,
        total_duration_seconds,
        difficulty_level,
        status,
        created_at
      `)
      .eq('status', 'published')
      .order('order_index', { ascending: true })

    if (coursesError) {
      console.error('Error al obtener cursos:', coursesError)
      return NextResponse.json(
        { error: 'Error al obtener cursos' },
        { status: 500 }
      )
    }

    // Obtener progreso del estudiante para cada curso
    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select('course_id, chapter_id, completed, progress_percent')
      .eq('student_id', studentId)

    if (progressError) {
      console.error('Error al obtener progreso:', progressError)
    }

    // Calcular progreso por curso
    const progressByCourse = new Map<string, { completed: number; total: number }>()

    if (progress) {
      for (const p of progress) {
        const current = progressByCourse.get(p.course_id) || { completed: 0, total: 0 }
        current.total++
        if (p.completed) {
          current.completed++
        }
        progressByCourse.set(p.course_id, current)
      }
    }

    // Combinar cursos con progreso
    const coursesWithProgress = courses.map(course => {
      const courseProgress = progressByCourse.get(course.id)
      const completedChapters = courseProgress?.completed || 0
      const totalChapters = course.total_chapters || 0
      const progressPercent = totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0

      return {
        ...course,
        progress: {
          completedChapters,
          totalChapters,
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
