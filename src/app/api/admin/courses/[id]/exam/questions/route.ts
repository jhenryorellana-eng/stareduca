import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const studentId = user.user_metadata?.student_id
  if (!studentId) return null

  const { data: student } = await serviceClient
    .from('students')
    .select('id, role')
    .eq('id', studentId)
    .single()

  if (!student || student.role !== 'admin') return null
  return student
}

// GET /api/admin/courses/[id]/exam/questions - Lista de preguntas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el examen del curso
    const { data: exam } = await serviceClient
      .from('course_exams')
      .select('id')
      .eq('course_id', courseId)
      .single()

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Examen no encontrado' },
        { status: 404 }
      )
    }

    // Obtener preguntas
    const { data: questions, error } = await serviceClient
      .from('exam_questions')
      .select('*')
      .eq('exam_id', exam.id)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar preguntas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: questions || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/courses/[id]/exam/questions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[id]/exam/questions - Crear pregunta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el examen del curso
    const { data: exam } = await serviceClient
      .from('course_exams')
      .select('id')
      .eq('course_id', courseId)
      .single()

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Examen no encontrado. Crea el examen primero.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { question_text, options, correct_option_index } = body

    // Validaciones
    if (!question_text || question_text.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'La pregunta debe tener al menos 5 caracteres' },
        { status: 400 }
      )
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Se requieren exactamente 4 opciones' },
        { status: 400 }
      )
    }

    // Validar que todas las opciones tengan texto
    const validOptions = options.every((opt: { text?: string }) =>
      opt.text && opt.text.trim().length > 0
    )
    if (!validOptions) {
      return NextResponse.json(
        { success: false, error: 'Todas las opciones deben tener texto' },
        { status: 400 }
      )
    }

    if (correct_option_index === undefined || correct_option_index < 0 || correct_option_index > 3) {
      return NextResponse.json(
        { success: false, error: 'Indice de opcion correcta invalido (0-3)' },
        { status: 400 }
      )
    }

    // Obtener el maximo order_index
    const { data: maxQuestion } = await serviceClient
      .from('exam_questions')
      .select('order_index')
      .eq('exam_id', exam.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (maxQuestion?.order_index || 0) + 1

    // Crear pregunta
    const { data: question, error } = await serviceClient
      .from('exam_questions')
      .insert({
        exam_id: exam.id,
        question_text: question_text.trim(),
        options: options.map((opt: { text: string }) => ({ text: opt.text.trim() })),
        correct_option_index: correct_option_index,
        order_index: orderIndex
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear pregunta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      question
    })

  } catch (error) {
    console.error('Error in POST /api/admin/courses/[id]/exam/questions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
