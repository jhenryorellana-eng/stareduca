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

// POST /api/admin/upload - Subir archivo
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'materials'

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

    // Generar nombre unico
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const fileName = `${folder}/${timestamp}-${randomSuffix}.${extension}`

    // Convertir a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
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
    const { data: { publicUrl } } = supabase.storage
      .from('course-materials')
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
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path del archivo requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase.storage
      .from('course-materials')
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
