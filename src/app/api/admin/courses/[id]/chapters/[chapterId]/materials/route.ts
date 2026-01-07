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

// GET /api/admin/courses/[id]/chapters/[chapterId]/materials - Lista de materiales
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { chapterId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data: materials, error } = await serviceClient
      .from('chapter_materials')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching materials:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar materiales' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      materials: materials || []
    })

  } catch (error) {
    console.error('Error in GET materials:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[id]/chapters/[chapterId]/materials - Crear material
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { chapterId } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el capitulo existe
    const { data: chapter } = await serviceClient
      .from('chapters')
      .select('id')
      .eq('id', chapterId)
      .single()

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Capitulo no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      material_type,
      title,
      content,
      file_url,
      file_size
    } = body

    if (!material_type || !title) {
      return NextResponse.json(
        { success: false, error: 'Tipo y titulo son requeridos' },
        { status: 400 }
      )
    }

    const validTypes = ['video', 'text', 'pdf', 'link', 'download']
    if (!validTypes.includes(material_type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de material invalido' },
        { status: 400 }
      )
    }

    // Obtener el maximo order_index
    const { data: maxOrder } = await serviceClient
      .from('chapter_materials')
      .select('order_index')
      .eq('chapter_id', chapterId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (maxOrder?.order_index || 0) + 1

    const { data: material, error } = await serviceClient
      .from('chapter_materials')
      .insert({
        chapter_id: chapterId,
        type: material_type,
        title: title.trim(),
        content: content || null,
        file_url: file_url || null,
        file_size_bytes: file_size || null,
        order_index: orderIndex
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear material' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material
    })

  } catch (error) {
    console.error('Error in POST materials:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/courses/[id]/chapters/[chapterId]/materials - Actualizar material
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { materialId, ...updates } = body

    if (!materialId) {
      return NextResponse.json(
        { success: false, error: 'ID de material requerido' },
        { status: 400 }
      )
    }

    // Mapear campos del frontend a campos de BD
    const fieldMapping: Record<string, string> = {
      'title': 'title',
      'content': 'content',
      'file_url': 'file_url',
      'file_size': 'file_size_bytes',
      'order_index': 'order_index'
    }

    const filteredUpdates: Record<string, any> = {}
    for (const [frontendField, dbField] of Object.entries(fieldMapping)) {
      if (updates[frontendField] !== undefined) {
        filteredUpdates[dbField] = updates[frontendField]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const { data: material, error } = await serviceClient
      .from('chapter_materials')
      .update(filteredUpdates)
      .eq('id', materialId)
      .select()
      .single()

    if (error) {
      console.error('Error updating material:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar material' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material
    })

  } catch (error) {
    console.error('Error in PATCH materials:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courses/[id]/chapters/[chapterId]/materials - Eliminar material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json(
        { success: false, error: 'ID de material requerido' },
        { status: 400 }
      )
    }

    // Obtener material para verificar si tiene archivo
    const { data: material } = await serviceClient
      .from('chapter_materials')
      .select('file_url')
      .eq('id', materialId)
      .single()

    if (material?.file_url && material.file_url.includes('supabase')) {
      // Extraer path del archivo y eliminarlo del storage
      const pathMatch = material.file_url.match(/course-materials\/(.+)/)
      if (pathMatch) {
        await serviceClient.storage.from('course-materials').remove([pathMatch[1]])
      }
    }

    const { error } = await serviceClient
      .from('chapter_materials')
      .delete()
      .eq('id', materialId)

    if (error) {
      console.error('Error deleting material:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar material' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE materials:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
