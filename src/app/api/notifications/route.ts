import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/notifications - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Query notificaciones
    let query = serviceClient
      .from('notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar notificaciones' },
        { status: 500 }
      )
    }

    // Contar notificaciones no leídas
    const { count: unreadCount } = await serviceClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    })

  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Marcar todas como leídas
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 400 }
      )
    }

    // Marcar todas las notificaciones como leídas
    const { error } = await serviceClient
      .from('notifications')
      .update({ is_read: true })
      .eq('student_id', studentId)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json(
        { success: false, error: 'Error al marcar notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
