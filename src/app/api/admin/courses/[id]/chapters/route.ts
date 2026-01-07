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

// GET /api/admin/courses/[id]/chapters - Lista de capitulos
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
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener capitulos
    const { data: chapters, error } = await serviceClient
      .from('chapters')
      .select(`
        id,
        chapter_number,
        title,
        description,
        video_url,
        video_duration_seconds,
        is_free_preview,
        order_index,
        created_at,
        updated_at
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching chapters:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar capitulos' },
        { status: 500 }
      )
    }

    // Obtener conteo de materiales por capitulo
    const chapterIds = chapters?.map(c => c.id) || []
    let materialCounts: Record<string, number> = {}

    if (chapterIds.length > 0) {
      const { data: materials } = await serviceClient
        .from('chapter_materials')
        .select('chapter_id')
        .in('chapter_id', chapterIds)

      if (materials) {
        materialCounts = materials.reduce((acc, m) => {
          acc[m.chapter_id] = (acc[m.chapter_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    const chaptersWithCounts = chapters?.map(chapter => ({
      ...chapter,
      materials_count: materialCounts[chapter.id] || 0
    }))

    return NextResponse.json({
      success: true,
      course,
      chapters: chaptersWithCounts || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/courses/[id]/chapters:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[id]/chapters - Crear capitulo
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

    const body = await request.json()
    const {
      title,
      description,
      video_url,
      video_duration_seconds
    } = body

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'El titulo es requerido (minimo 3 caracteres)' },
        { status: 400 }
      )
    }

    // Obtener el maximo order_index y chapter_number
    const { data: maxChapter } = await serviceClient
      .from('chapters')
      .select('order_index, chapter_number')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (maxChapter?.order_index || 0) + 1
    const chapterNumber = (maxChapter?.chapter_number || 0) + 1

    const { data: chapter, error } = await serviceClient
      .from('chapters')
      .insert({
        course_id: courseId,
        chapter_number: chapterNumber,
        title: title.trim(),
        description: description?.trim() || null,
        video_url: video_url || null,
        video_duration_seconds: video_duration_seconds || 0,
        is_free_preview: false,
        order_index: orderIndex
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chapter:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear capitulo' },
        { status: 500 }
      )
    }

    // Actualizar total_chapters en el curso
    const { data: totalCount } = await serviceClient
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    await serviceClient
      .from('courses')
      .update({
        total_chapters: totalCount || 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)

    return NextResponse.json({
      success: true,
      chapter
    })

  } catch (error) {
    console.error('Error in POST /api/admin/courses/[id]/chapters:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
