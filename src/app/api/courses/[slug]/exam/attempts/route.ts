// ============================================================================
// API: HISTORIAL DE INTENTOS DE EXAMEN
// GET /api/courses/[slug]/exam/attempts
// Retorna los intentos del estudiante para el examen del curso
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
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
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener examen del curso
    const { data: exam } = await serviceClient
      .from('course_exams')
      .select('id, passing_percentage')
      .eq('course_id', course.id)
      .single()

    if (!exam) {
      return NextResponse.json({
        success: true,
        attempts: [],
        message: 'Este curso no tiene examen'
      })
    }

    // Obtener intentos del estudiante
    const { data: attempts, error: attemptsError } = await serviceClient
      .from('exam_attempts')
      .select('id, score, total_questions, percentage, passed, started_at, completed_at, created_at')
      .eq('exam_id', exam.id)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError)
      return NextResponse.json(
        { error: 'Error al obtener intentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attempts: attempts || [],
      examInfo: {
        passingPercentage: exam.passing_percentage
      }
    })

  } catch (error) {
    console.error('Error en GET /api/courses/[slug]/exam/attempts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
