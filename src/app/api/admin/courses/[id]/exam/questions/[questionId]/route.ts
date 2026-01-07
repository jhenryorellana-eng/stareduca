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

// PATCH /api/admin/courses/[id]/exam/questions/[questionId] - Actualizar pregunta
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id: courseId, questionId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que la pregunta existe y pertenece al examen del curso
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

    const { data: existingQuestion } = await serviceClient
      .from('exam_questions')
      .select('id')
      .eq('id', questionId)
      .eq('exam_id', exam.id)
      .single()

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Pregunta no encontrada' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.question_text !== undefined) {
      if (body.question_text.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: 'La pregunta debe tener al menos 5 caracteres' },
          { status: 400 }
        )
      }
      updates.question_text = body.question_text.trim()
    }

    if (body.options !== undefined) {
      if (!Array.isArray(body.options) || body.options.length !== 4) {
        return NextResponse.json(
          { success: false, error: 'Se requieren exactamente 4 opciones' },
          { status: 400 }
        )
      }
      const validOptions = body.options.every((opt: { text?: string }) =>
        opt.text && opt.text.trim().length > 0
      )
      if (!validOptions) {
        return NextResponse.json(
          { success: false, error: 'Todas las opciones deben tener texto' },
          { status: 400 }
        )
      }
      updates.options = body.options.map((opt: { text: string }) => ({ text: opt.text.trim() }))
    }

    if (body.correct_option_index !== undefined) {
      if (body.correct_option_index < 0 || body.correct_option_index > 3) {
        return NextResponse.json(
          { success: false, error: 'Indice de opcion correcta invalido (0-3)' },
          { status: 400 }
        )
      }
      updates.correct_option_index = body.correct_option_index
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios para aplicar' },
        { status: 400 }
      )
    }

    const { data: question, error } = await serviceClient
      .from('exam_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar pregunta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      question
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/courses/[id]/exam/questions/[questionId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[id]/exam/questions/[questionId] - Eliminar pregunta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id: courseId, questionId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que la pregunta existe y pertenece al examen del curso
    const { data: exam } = await serviceClient
      .from('course_exams')
      .select('id, is_enabled')
      .eq('course_id', courseId)
      .single()

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Examen no encontrado' },
        { status: 404 }
      )
    }

    const { data: existingQuestion } = await serviceClient
      .from('exam_questions')
      .select('id')
      .eq('id', questionId)
      .eq('exam_id', exam.id)
      .single()

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Pregunta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar pregunta
    const { error } = await serviceClient
      .from('exam_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar pregunta' },
        { status: 500 }
      )
    }

    // Si el examen esta habilitado y no quedan preguntas, deshabilitarlo
    if (exam.is_enabled) {
      const { count } = await serviceClient
        .from('exam_questions')
        .select('id', { count: 'exact', head: true })
        .eq('exam_id', exam.id)

      if (!count || count === 0) {
        await serviceClient
          .from('course_exams')
          .update({ is_enabled: false })
          .eq('id', exam.id)
      }
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/courses/[id]/exam/questions/[questionId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
