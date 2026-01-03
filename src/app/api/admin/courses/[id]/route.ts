import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin(authToken: string) {
  const { data: { user } } = await supabase.auth.getUser(authToken)
  if (!user) return null

  const studentId = user.user_metadata?.student_id
  if (!studentId) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, role')
    .eq('id', studentId)
    .single()

  if (!student || student.role !== 'admin') return null
  return student
}

// GET /api/admin/courses/[id] - Obtener curso
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        chapters (
          id,
          chapter_number,
          title,
          description,
          video_url,
          video_duration_seconds,
          is_free_preview,
          order_index,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error || !course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Ordenar capitulos
    if (course.chapters) {
      course.chapters.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json({
      success: true,
      course
    })

  } catch (error) {
    console.error('Error in GET /api/admin/courses/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/courses/[id] - Actualizar curso
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que el curso existe
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const allowedFields = [
      'title', 'description', 'short_description', 'thumbnail_url',
      'instructor_name', 'instructor_bio', 'category', 'tags',
      'is_published', 'is_featured', 'is_free', 'order_index'
    ]

    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data: course, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating course:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar curso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/courses/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[id] - Eliminar curso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que el curso existe
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', id)
      .single()

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar curso (los capitulos y materiales se eliminan en cascada)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting course:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar curso' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/admin/courses/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
