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

// PUT /api/admin/courses/[id]/chapters/reorder - Reordenar capitulos
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

    const body = await request.json()
    const { chapters } = body as { chapters: { id: string; order_index: number; chapter_number: number }[] }

    if (!chapters || !Array.isArray(chapters)) {
      return NextResponse.json(
        { success: false, error: 'Datos invalidos' },
        { status: 400 }
      )
    }

    // Actualizar en dos pasos para evitar violacion de UNIQUE constraint en chapter_number
    console.log('Reordenando capitulos:', JSON.stringify(chapters))

    // Paso 1: Poner chapter_number temporales (negativos) para evitar conflictos
    for (let i = 0; i < chapters.length; i++) {
      const { error } = await serviceClient
        .from('chapters')
        .update({ chapter_number: -(i + 1) })
        .eq('id', chapters[i].id)
        .eq('course_id', courseId)

      if (error) {
        console.error('Error en paso 1 (temporal):', chapters[i].id, error)
        return NextResponse.json(
          { success: false, error: `Error al preparar reorden` },
          { status: 500 }
        )
      }
    }

    // Paso 2: Actualizar con valores finales
    for (const ch of chapters) {
      const { error } = await serviceClient
        .from('chapters')
        .update({
          order_index: ch.order_index,
          chapter_number: ch.chapter_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', ch.id)
        .eq('course_id', courseId)

      if (error) {
        console.error('Error en paso 2 (final):', ch.id, error)
        return NextResponse.json(
          { success: false, error: `Error al actualizar capitulo ${ch.id}` },
          { status: 500 }
        )
      }
    }

    console.log('Reorden completado exitosamente')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PUT /api/admin/courses/[id]/chapters/reorder:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
