import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente con service role para operaciones admin (bypassa RLS)
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar que el usuario es admin
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

// GET /api/admin/courses/[id]/exam - Obtener configuracion del examen
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

    // Verificar que el curso existe
    const { data: course } = await serviceClient
      .from('courses')
      .select('id, title, slug')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener configuracion del examen
    const { data: exam, error } = await serviceClient
      .from('course_exams')
      .select('*')
      .eq('course_id', courseId)
      .single()

    if (error && error.code !== 'PGRST116') { // No es "not found"
      console.error('Error fetching exam:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar examen' },
        { status: 500 }
      )
    }

    // Obtener conteo de preguntas si existe examen
    let questionsCount = 0
    if (exam) {
      const { count } = await serviceClient
        .from('exam_questions')
        .select('id', { count: 'exact', head: true })
        .eq('exam_id', exam.id)

      questionsCount = count || 0
    }

    return NextResponse.json({
      success: true,
      course,
      exam: exam ? { ...exam, questions_count: questionsCount } : null
    })

  } catch (error) {
    console.error('Error in GET /api/admin/courses/[id]/exam:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[id]/exam - Crear configuracion del examen
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

    // Verificar que el curso existe
    const { data: course } = await serviceClient
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya un examen
    const { data: existingExam } = await serviceClient
      .from('course_exams')
      .select('id')
      .eq('course_id', courseId)
      .single()

    if (existingExam) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un examen para este curso' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title = 'Examen Final',
      description,
      passing_percentage = 70
    } = body

    // Validar porcentaje
    const percentage = Math.min(100, Math.max(0, parseInt(passing_percentage) || 70))

    const { data: exam, error } = await serviceClient
      .from('course_exams')
      .insert({
        course_id: courseId,
        title: title.trim(),
        description: description?.trim() || null,
        passing_percentage: percentage,
        is_enabled: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating exam:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear examen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exam: { ...exam, questions_count: 0 }
    })

  } catch (error) {
    console.error('Error in POST /api/admin/courses/[id]/exam:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/courses/[id]/exam - Actualizar configuracion del examen
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener examen existente
    const { data: existingExam } = await serviceClient
      .from('course_exams')
      .select('id')
      .eq('course_id', courseId)
      .single()

    if (!existingExam) {
      return NextResponse.json(
        { success: false, error: 'Examen no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) {
      updates.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null
    }
    if (body.passing_percentage !== undefined) {
      updates.passing_percentage = Math.min(100, Math.max(0, parseInt(body.passing_percentage) || 70))
    }
    if (body.is_enabled !== undefined) {
      // Solo permitir habilitar si hay al menos una pregunta
      if (body.is_enabled === true) {
        const { count } = await serviceClient
          .from('exam_questions')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', existingExam.id)

        if (!count || count === 0) {
          return NextResponse.json(
            { success: false, error: 'No se puede habilitar el examen sin preguntas' },
            { status: 400 }
          )
        }
      }
      updates.is_enabled = body.is_enabled
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios para aplicar' },
        { status: 400 }
      )
    }

    const { data: exam, error } = await serviceClient
      .from('course_exams')
      .update(updates)
      .eq('id', existingExam.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating exam:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar examen' },
        { status: 500 }
      )
    }

    // Obtener conteo de preguntas
    const { count: questionsCount } = await serviceClient
      .from('exam_questions')
      .select('id', { count: 'exact', head: true })
      .eq('exam_id', exam.id)

    return NextResponse.json({
      success: true,
      exam: { ...exam, questions_count: questionsCount || 0 }
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/courses/[id]/exam:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
