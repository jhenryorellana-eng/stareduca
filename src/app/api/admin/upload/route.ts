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

// Mapear folder a bucket existente
function getBucket(folder: string): string {
  switch (folder) {
    case 'course-thumbnails':
      return 'course-thumbnails'
    case 'course-videos':
      return 'chapter-videos'
    case 'avatars':
      return 'avatars'
    case 'post-images':
      return 'post-images'
    case 'course-materials':
    case 'chapter-materials':
    case 'materials':
      return 'course-materials'
    default:
      return 'course-thumbnails'
  }
}

// POST /api/admin/upload - Subir archivo
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'course-thumbnails'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporciono archivo' },
        { status: 400 }
      )
    }

    // Validar tamanio (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el limite de 50MB' },
        { status: 400 }
      )
    }

    // Determinar bucket segun folder
    const bucket = getBucket(folder)

    // Generar nombre unico
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomSuffix}.${extension}`

    // Convertir a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Supabase Storage
    const { data, error } = await serviceClient.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json(
        { success: false, error: 'Error al subir archivo' },
        { status: 500 }
      )
    }

    // Obtener URL publica
    const { data: { publicUrl } } = serviceClient.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      size: file.size,
      type: file.type,
      name: file.name
    })

  } catch (error) {
    console.error('Error in POST /api/admin/upload:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/upload - Eliminar archivo
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const folder = searchParams.get('folder') || 'course-thumbnails'

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path del archivo requerido' },
        { status: 400 }
      )
    }

    const bucket = getBucket(folder)

    const { error } = await serviceClient.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Error deleting file:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar archivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/admin/upload:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
