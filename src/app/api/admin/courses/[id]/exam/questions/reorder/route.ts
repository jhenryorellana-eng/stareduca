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

// PUT /api/admin/courses/[id]/exam/questions/reorder - Reordenar preguntas
export async function PUT(
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

    const body = await request.json()
    const { questionIds } = body

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de IDs de preguntas requerida' },
        { status: 400 }
      )
    }

    // Actualizar order_index de cada pregunta
    const updates = questionIds.map((questionId: string, index: number) =>
      serviceClient
        .from('exam_questions')
        .update({ order_index: index + 1 })
        .eq('id', questionId)
        .eq('exam_id', exam.id)
    )

    await Promise.all(updates)

    // Obtener preguntas actualizadas
    const { data: questions, error } = await serviceClient
      .from('exam_questions')
      .select('*')
      .eq('exam_id', exam.id)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching updated questions:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener preguntas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: questions || []
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/courses/[id]/exam/questions/reorder:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
