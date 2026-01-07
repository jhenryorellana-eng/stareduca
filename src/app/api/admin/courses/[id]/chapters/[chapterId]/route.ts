import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente con service role para operaciones admin (bypassa RLS)
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper para extraer path del storage desde URL
function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
  return match ? match[1] : null
}

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

// GET /api/admin/courses/[id]/chapters/[chapterId] - Obtener capitulo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id: courseId, chapterId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener capitulo (sin JOIN para evitar errores de relacion)
    const { data: chapter, error } = await serviceClient
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('course_id', courseId)
      .single()

    if (error || !chapter) {
      return NextResponse.json(
        { success: false, error: 'Capitulo no encontrado' },
        { status: 404 }
      )
    }

    // Obtener materiales por separado (no falla si tabla no existe)
    let materials: any[] = []
    try {
      const { data } = await serviceClient
        .from('chapter_materials')
        .select('id, type, title, content, file_url, file_size_bytes, order_index, created_at')
        .eq('chapter_id', chapterId)
        .order('order_index', { ascending: true })
      // Mapear nombres de campos de BD a nombres que espera el frontend
      materials = (data || []).map(m => ({
        ...m,
        material_type: m.type,
        file_size: m.file_size_bytes
      }))
    } catch (e) {
      console.error('Error fetching materials:', e)
    }

    return NextResponse.json({
      success: true,
      chapter: { ...chapter, chapter_materials: materials }
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
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el capitulo existe y obtener video actual
    const { data: existingChapter } = await serviceClient
      .from('chapters')
      .select('id, video_url')
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
      'order_index', 'chapter_number'
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

    // Si hay nuevo video y es diferente al anterior, eliminar el anterior
    if (updates.video_url !== undefined &&
        existingChapter.video_url &&
        existingChapter.video_url !== updates.video_url) {
      const oldPath = extractStoragePath(existingChapter.video_url)
      if (oldPath) {
        try {
          await serviceClient.storage.from('chapter-videos').remove([oldPath])
        } catch (e) {
          console.error('Error deleting old video:', e)
        }
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data: chapter, error } = await serviceClient
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
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener capitulo con video_url
    const { data: chapter } = await serviceClient
      .from('chapters')
      .select('id, title, video_url')
      .eq('id', chapterId)
      .eq('course_id', courseId)
      .single()

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Capitulo no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar video del Storage si existe
    if (chapter.video_url) {
      const path = extractStoragePath(chapter.video_url)
      if (path) {
        try {
          await serviceClient.storage.from('chapter-videos').remove([path])
        } catch (storageError) {
          console.error(`Error deleting video ${path}:`, storageError)
          // Continuar aunque falle la eliminacion del archivo
        }
      }
    }

    // Eliminar capitulo (los materiales se eliminan en cascada)
    const { error } = await serviceClient
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
    const { count } = await serviceClient
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    await serviceClient
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
  const { data: chapters } = await serviceClient
    .from('chapters')
    .select('video_duration_seconds')
    .eq('course_id', courseId)

  const totalSeconds = chapters?.reduce((sum, ch) => sum + (ch.video_duration_seconds || 0), 0) || 0
  const totalMinutes = Math.ceil(totalSeconds / 60)

  await serviceClient
    .from('courses')
    .update({ total_duration_minutes: totalMinutes })
    .eq('id', courseId)
}
