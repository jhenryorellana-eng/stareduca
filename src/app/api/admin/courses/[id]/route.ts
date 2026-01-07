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

// GET /api/admin/courses/[id] - Obtener curso
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data: course, error } = await serviceClient
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
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el curso existe y obtener datos actuales
    const { data: existingCourse } = await serviceClient
      .from('courses')
      .select('id, thumbnail_url, presentation_video_url')
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
      'presentation_video_url', 'instructor_name', 'instructor_bio',
      'category', 'tags', 'is_published', 'order_index'
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

    // Si hay nuevo thumbnail y es diferente al anterior, eliminar el anterior
    if (updates.thumbnail_url !== undefined &&
        existingCourse.thumbnail_url &&
        existingCourse.thumbnail_url !== updates.thumbnail_url) {
      const oldPath = extractStoragePath(existingCourse.thumbnail_url)
      if (oldPath) {
        try {
          await serviceClient.storage.from('course-thumbnails').remove([oldPath])
        } catch (e) {
          console.error('Error deleting old thumbnail:', e)
        }
      }
    }

    // Si hay nuevo video de presentación y es diferente al anterior, eliminar el anterior
    if (updates.presentation_video_url !== undefined &&
        existingCourse.presentation_video_url &&
        existingCourse.presentation_video_url !== updates.presentation_video_url) {
      const oldPath = extractStoragePath(existingCourse.presentation_video_url)
      if (oldPath) {
        try {
          await serviceClient.storage.from('chapter-videos').remove([oldPath])
        } catch (e) {
          console.error('Error deleting old presentation video:', e)
        }
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data: course, error } = await serviceClient
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
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener curso con thumbnail, video de presentación y videos de capitulos
    const { data: course } = await serviceClient
      .from('courses')
      .select(`
        id, title, thumbnail_url, presentation_video_url,
        chapters (video_url)
      `)
      .eq('id', id)
      .single()

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Recolectar archivos a eliminar del Storage
    const filesToDelete: { bucket: string; path: string }[] = []

    // Thumbnail del curso
    if (course.thumbnail_url) {
      const path = extractStoragePath(course.thumbnail_url)
      if (path) filesToDelete.push({ bucket: 'course-thumbnails', path })
    }

    // Video de presentación del curso
    if (course.presentation_video_url) {
      const path = extractStoragePath(course.presentation_video_url)
      if (path) filesToDelete.push({ bucket: 'chapter-videos', path })
    }

    // Videos de capitulos
    for (const chapter of course.chapters || []) {
      if (chapter.video_url) {
        const path = extractStoragePath(chapter.video_url)
        if (path) filesToDelete.push({ bucket: 'chapter-videos', path })
      }
    }

    // Eliminar archivos del Storage
    for (const file of filesToDelete) {
      try {
        await serviceClient.storage.from(file.bucket).remove([file.path])
      } catch (storageError) {
        console.error(`Error deleting storage file ${file.path}:`, storageError)
        // Continuar aunque falle la eliminacion del archivo
      }
    }

    // Eliminar curso (los capitulos y materiales se eliminan en cascada)
    const { error } = await serviceClient
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
