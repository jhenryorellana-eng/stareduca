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

// GET /api/admin/courses/[id]/chapters/[chapterId] - Obtener capitulo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id: courseId, chapterId } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener capitulo con materiales
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select(`
        *,
        chapter_materials (
          id,
          material_type,
          title,
          description,
          content,
          file_url,
          file_size,
          order_index,
          created_at
        )
      `)
      .eq('id', chapterId)
      .eq('course_id', courseId)
      .single()

    if (error || !chapter) {
      return NextResponse.json(
        { success: false, error: 'Capitulo no encontrado' },
        { status: 404 }
      )
    }

    // Ordenar materiales
    if (chapter.chapter_materials) {
      chapter.chapter_materials.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json({
      success: true,
      chapter
    })

  } catch (error) {
    console.error('Error in GET /api/admin/courses/[id]/chapters/[chapterId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/courses/[id]/chapters/[chapterId] - Actualizar capitulo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id: courseId, chapterId } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que el capitulo existe
    const { data: existingChapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('id', chapterId)
      .eq('course_id', courseId)
      .single()

    if (!existingChapter) {
      return NextResponse.json(
        { success: false, error: 'Capitulo no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const allowedFields = [
      'title', 'description', 'video_url', 'video_duration_seconds',
      'is_free_preview', 'order_index', 'chapter_number'
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

    const { data: chapter, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', chapterId)
      .select()
      .single()

    if (error) {
      console.error('Error updating chapter:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar capitulo' },
        { status: 500 }
      )
    }

    // Actualizar duracion total del curso
    await updateCourseDuration(courseId)

    return NextResponse.json({
      success: true,
      chapter
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/courses/[id]/chapters/[chapterId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[id]/chapters/[chapterId] - Eliminar capitulo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id: courseId, chapterId } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que el capitulo existe
    const { data: existingChapter } = await supabase
      .from('chapters')
      .select('id, title')
      .eq('id', chapterId)
      .eq('course_id', courseId)
      .single()

    if (!existingChapter) {
      return NextResponse.json(
        { success: false, error: 'Capitulo no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar capitulo (los materiales se eliminan en cascada)
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)

    if (error) {
      console.error('Error deleting chapter:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar capitulo' },
        { status: 500 }
      )
    }

    // Actualizar total_chapters y duracion del curso
    const { count } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    await supabase
      .from('courses')
      .update({
        total_chapters: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)

    await updateCourseDuration(courseId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/admin/courses/[id]/chapters/[chapterId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// Helper para actualizar duracion total del curso
async function updateCourseDuration(courseId: string) {
  const { data: chapters } = await supabase
    .from('chapters')
    .select('video_duration_seconds')
    .eq('course_id', courseId)

  const totalSeconds = chapters?.reduce((sum, ch) => sum + (ch.video_duration_seconds || 0), 0) || 0
  const totalMinutes = Math.ceil(totalSeconds / 60)

  await supabase
    .from('courses')
    .update({ total_duration_minutes: totalMinutes })
    .eq('id', courseId)
}
