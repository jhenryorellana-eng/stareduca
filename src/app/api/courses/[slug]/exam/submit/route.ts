// ============================================================================
// API: ENVIAR RESPUESTAS DE EXAMEN
// POST /api/courses/[slug]/exam/submit
// Califica el examen y guarda el intento
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyActiveSubscription } from '@/lib/auth/subscriptionCheck'

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

    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    const body = await request.json()
    const { answers } = body // { questionId: selectedOptionIndex }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Respuestas requeridas' },
        { status: 400 }
      )
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await serviceClient
      .from('courses')
      .select('id, title, chapters(id)')
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

    // Verificar que el estudiante ha completado el curso
    const { data: progress } = await serviceClient
      .from('student_progress')
      .select('chapters_completed')
      .eq('student_id', studentId)
      .eq('course_id', course.id)
      .single()

    const completedChapters = progress?.chapters_completed?.length || 0
    if (completedChapters < totalChapters) {
      return NextResponse.json(
        { error: 'Debes completar todos los capitulos primero' },
        { status: 403 }
      )
    }

    // Obtener examen y preguntas con respuestas correctas
    const { data: exam } = await serviceClient
      .from('course_exams')
      .select('id, passing_percentage, is_enabled')
      .eq('course_id', course.id)
      .single()

    if (!exam || !exam.is_enabled) {
      return NextResponse.json(
        { error: 'Examen no disponible' },
        { status: 404 }
      )
    }

    // Obtener preguntas con respuestas correctas
    const { data: questions } = await serviceClient
      .from('exam_questions')
      .select('id, question_text, options, correct_option_index')
      .eq('exam_id', exam.id)
      .order('order_index', { ascending: true })

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Examen sin preguntas' },
        { status: 400 }
      )
    }

    // Calificar examen
    let score = 0
    const questionResults: Record<string, { correct: boolean; correctIndex: number; selectedIndex: number }> = {}

    for (const question of questions) {
      const selectedIndex = answers[question.id]
      const isCorrect = selectedIndex === question.correct_option_index

      if (isCorrect) {
        score++
      }

      questionResults[question.id] = {
        correct: isCorrect,
        correctIndex: question.correct_option_index,
        selectedIndex: selectedIndex ?? -1
      }
    }

    const totalQuestions = questions.length
    const percentage = Math.round((score / totalQuestions) * 100)
    const passed = percentage >= exam.passing_percentage

    // Guardar intento
    const { data: attempt, error: attemptError } = await serviceClient
      .from('exam_attempts')
      .insert({
        exam_id: exam.id,
        student_id: studentId,
        answers: answers,
        score: score,
        total_questions: totalQuestions,
        percentage: percentage,
        passed: passed,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (attemptError) {
      console.error('Error saving attempt:', attemptError)
      return NextResponse.json(
        { error: 'Error al guardar resultado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result: {
        attemptId: attempt.id,
        score,
        totalQuestions,
        percentage,
        passed,
        passingPercentage: exam.passing_percentage,
        questionResults
      }
    })

  } catch (error) {
    console.error('Error en POST /api/courses/[slug]/exam/submit:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
