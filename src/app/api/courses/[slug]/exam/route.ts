// ============================================================================
// API: OBTENER EXAMEN DEL CURSO
// GET /api/courses/[slug]/exam
// Retorna el examen si el estudiante ha completado todos los capitulos
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyActiveSubscription } from '@/lib/auth/subscriptionCheck'

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

    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    // Obtener el curso por slug
    const { data: course, error: courseError } = await serviceClient
      .from('courses')
      .select('id, title, slug, chapters(id)')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const totalChapters = course.chapters?.length || 0

    // Obtener progreso del estudiante
    const { data: progress } = await serviceClient
      .from('student_progress')
      .select('chapters_completed, completed_at, progress_percentage')
      .eq('student_id', studentId)
      .eq('course_id', course.id)
      .single()

    const completedChapters = progress?.chapters_completed?.length || 0
    const courseCompleted = completedChapters >= totalChapters && totalChapters > 0

    // Si no ha completado el curso, no puede acceder al examen
    if (!courseCompleted) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'incomplete_course',
        progress: {
          completed: completedChapters,
          total: totalChapters,
          percentage: progress?.progress_percentage || 0
        }
      })
    }

    // Obtener examen del curso
    const { data: exam, error: examError } = await serviceClient
      .from('course_exams')
      .select('id, title, description, passing_percentage, is_enabled')
      .eq('course_id', course.id)
      .single()

    if (examError || !exam) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'no_exam',
        message: 'Este curso no tiene examen configurado'
      })
    }

    if (!exam.is_enabled) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'exam_disabled',
        message: 'El examen no esta disponible actualmente'
      })
    }

    // Obtener preguntas del examen (SIN respuestas correctas)
    const { data: questions, error: questionsError } = await serviceClient
      .from('exam_questions')
      .select('id, question_text, options, order_index')
      .eq('exam_id', exam.id)
      .order('order_index', { ascending: true })

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'no_questions',
        message: 'El examen no tiene preguntas'
      })
    }

    // Obtener intentos anteriores del estudiante
    const { data: attempts } = await serviceClient
      .from('exam_attempts')
      .select('id, score, total_questions, percentage, passed, completed_at')
      .eq('exam_id', exam.id)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    const passedAttempt = attempts?.find(a => a.passed)
    const totalAttempts = attempts?.length || 0
    const bestScore = attempts?.reduce((max, a) => Math.max(max, a.percentage), 0) || 0

    return NextResponse.json({
      success: true,
      eligible: true,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        passing_percentage: exam.passing_percentage,
        questions_count: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options // Solo el texto, sin indicar cual es correcta
        }))
      },
      stats: {
        totalAttempts,
        bestScore,
        passed: !!passedAttempt,
        passedAttemptId: passedAttempt?.id || null
      }
    })

  } catch (error) {
    console.error('Error en GET /api/courses/[slug]/exam:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
