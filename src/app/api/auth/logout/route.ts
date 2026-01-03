import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/auth/logout - Cerrar sesion
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (authToken) {
      // Intentar cerrar sesion en Supabase
      await supabase.auth.admin.signOut(authToken)
    }

    // Crear respuesta y eliminar cookies
    const response = NextResponse.json({ success: true })

    // Eliminar cookies de autenticacion
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response

  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error)

    // Aun asi eliminar cookies
    const response = NextResponse.json({ success: true })
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  }
}
