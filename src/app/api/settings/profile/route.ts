import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/settings/profile - Actualizar perfil
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sesion invalida' },
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

    const body = await request.json()
    const { full_name, avatar_url } = body

    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido (minimo 2 caracteres)' },
        { status: 400 }
      )
    }

    // Validar URL de avatar si se proporciona
    if (avatar_url) {
      try {
        new URL(avatar_url)
      } catch {
        return NextResponse.json(
          { success: false, error: 'URL de avatar invalida' },
          { status: 400 }
        )
      }
    }

    const { error } = await supabase
      .from('students')
      .update({
        full_name: full_name.trim(),
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PATCH /api/settings/profile:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
