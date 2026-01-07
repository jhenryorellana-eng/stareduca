import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/notifications/[notificationId] - Marcar notificación como leída
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params

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

    // Verificar que la notificación pertenece al usuario
    const { data: notification } = await serviceClient
      .from('notifications')
      .select('id, student_id')
      .eq('id', notificationId)
      .single()

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notification.student_id !== studentId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Marcar como leída
    const { error } = await serviceClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return NextResponse.json(
        { success: false, error: 'Error al marcar notificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PATCH /api/notifications/[notificationId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
