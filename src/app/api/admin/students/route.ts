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

// GET /api/admin/students - Lista de estudiantes
export async function GET(request: NextRequest) {
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    let query = supabase
      .from('students')
      .select(`
        id,
        student_code,
        full_name,
        email,
        phone,
        country,
        role,
        subscription_status,
        subscription_type,
        subscription_expires_at,
        created_at,
        last_login_at
      `, { count: 'exact' })

    // Filtro de busqueda
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_code.ilike.%${search}%`)
    }

    // Filtro de estado de suscripcion
    if (status === 'active') {
      query = query.eq('subscription_status', 'active')
    } else if (status === 'expired') {
      query = query.eq('subscription_status', 'expired')
    } else if (status === 'pending') {
      query = query.eq('subscription_status', 'pending')
    }

    const { data: students, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar estudiantes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      students: students || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/students:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/students - Actualizar estudiante
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { studentId, ...updates } = body

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'ID de estudiante requerido' },
        { status: 400 }
      )
    }

    const allowedFields = [
      'full_name', 'email', 'phone', 'country', 'role',
      'subscription_status', 'subscription_type', 'subscription_expires_at'
    ]

    const filteredUpdates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    filteredUpdates.updated_at = new Date().toISOString()

    const { data: student, error } = await supabase
      .from('students')
      .update(filteredUpdates)
      .eq('id', studentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating student:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar estudiante' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      student
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/students:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
