import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const DEFAULT_PREFERENCES = {
  email_comments: true,
  email_reactions: true,
  email_mentions: true,
  email_course_updates: true,
  email_subscription: true,
  email_affiliate: true,
  email_marketing: false,
  push_enabled: true
}

// GET /api/settings/notifications - Obtener preferencias
export async function GET() {
  try {
    // Verificar autenticacion
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

    const adminClient = createAdminClient()

    // Buscar preferencias existentes
    const { data: preferences, error } = await adminClient
      .from('notification_preferences')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar preferencias' },
        { status: 500 }
      )
    }

    // Si no existen, crear con valores por defecto
    if (!preferences) {
      const { data: newPrefs, error: createError } = await adminClient
        .from('notification_preferences')
        .insert({
          student_id: studentId,
          ...DEFAULT_PREFERENCES
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating preferences:', createError)
        return NextResponse.json({
          success: true,
          preferences: DEFAULT_PREFERENCES
        })
      }

      return NextResponse.json({
        success: true,
        preferences: newPrefs
      })
    }

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('Error in GET /api/settings/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings/notifications - Actualizar preferencias
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticacion
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

    const adminClient = createAdminClient()
    const body = await request.json()

    // Solo permitir campos validos
    const allowedFields = Object.keys(DEFAULT_PREFERENCES)
    const updates: Record<string, boolean> = {}

    for (const key of allowedFields) {
      if (typeof body[key] === 'boolean') {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos validos para actualizar' },
        { status: 400 }
      )
    }

    // Upsert preferencias
    const { error } = await adminClient
      .from('notification_preferences')
      .upsert({
        student_id: studentId,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id'
      })

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar preferencias' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PATCH /api/settings/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
