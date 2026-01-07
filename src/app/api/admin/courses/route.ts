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

// GET /api/admin/courses - Lista de cursos
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    let query = serviceClient
      .from('courses')
      .select(`
        id,
        slug,
        title,
        description,
        thumbnail_url,
        instructor_name,
        total_chapters,
        total_duration_minutes,
        is_published,
        is_featured,
        category,
        order_index,
        created_at,
        updated_at
      `, { count: 'exact' })

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: courses, error, count } = await query
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar cursos' },
        { status: 500 }
      )
    }

    // Obtener conteo de capitulos por curso
    const courseIds = courses?.map(c => c.id) || []
    let chapterCounts: Record<string, number> = {}

    if (courseIds.length > 0) {
      const { data: chapters } = await serviceClient
        .from('chapters')
        .select('course_id')
        .in('course_id', courseIds)

      if (chapters) {
        chapterCounts = chapters.reduce((acc, ch) => {
          acc[ch.course_id] = (acc[ch.course_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    const coursesWithCounts = courses?.map(course => ({
      ...course,
      chapters_count: chapterCounts[course.id] || 0
    }))

    return NextResponse.json({
      success: true,
      courses: coursesWithCounts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/courses:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses - Crear curso
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      short_description,
      thumbnail_url,
      presentation_video_url,
      instructor_name,
      instructor_bio,
      category,
      tags,
      is_published,
      is_featured,
      is_free
    } = body

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'El titulo es requerido (minimo 3 caracteres)' },
        { status: 400 }
      )
    }

    // Generar slug unico
    let slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Verificar si el slug existe
    const { data: existingCourse } = await serviceClient
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCourse) {
      slug = `${slug}-${Date.now()}`
    }

    // Obtener el maximo order_index
    const { data: maxOrder } = await serviceClient
      .from('courses')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (maxOrder?.order_index || 0) + 1

    const { data: course, error } = await serviceClient
      .from('courses')
      .insert({
        slug,
        title: title.trim(),
        description: description?.trim() || null,
        short_description: short_description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        presentation_video_url: presentation_video_url || null,
        instructor_name: instructor_name?.trim() || null,
        instructor_bio: instructor_bio?.trim() || null,
        instructor_id: admin.id,
        category: category || null,
        tags: tags || [],
        is_published: is_published || false,
        is_featured: is_featured || false,
        is_free: is_free || false,
        order_index: orderIndex
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear curso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course
    })

  } catch (error) {
    console.error('Error in POST /api/admin/courses:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
