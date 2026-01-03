// ============================================================================
// API: SSO - VERIFICAR TOKEN
// POST /api/auth/sso/verify
// Starbooks llama a este endpoint para verificar un token SSO
// El token solo se puede usar una vez
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      )
    }

    // Validar API key de la app (Starbooks)
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SSO_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API key invalida' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Buscar token
    const { data: ssoToken, error: tokenError } = await supabase
      .from('sso_tokens')
      .select(`
        id,
        student_id,
        expires_at,
        used,
        students (
          id,
          student_code,
          email,
          full_name,
          avatar_url,
          subscription_status,
          subscription_end_date
        )
      `)
      .eq('token', token)
      .single()

    if (tokenError || !ssoToken) {
      return NextResponse.json(
        { success: false, error: 'Token invalido o no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no haya expirado
    if (new Date(ssoToken.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Token expirado' },
        { status: 401 }
      )
    }

    // Verificar que no haya sido usado
    if (ssoToken.used) {
      return NextResponse.json(
        { success: false, error: 'Token ya fue utilizado' },
        { status: 401 }
      )
    }

    // Marcar token como usado
    await supabase
      .from('sso_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', ssoToken.id)

    const student = ssoToken.students as unknown as {
      id: string
      student_code: string
      email: string
      full_name: string
      avatar_url: string | null
      subscription_status: string
      subscription_end_date: string
    }

    // Retornar datos del usuario verificado
    return NextResponse.json({
      success: true,
      verified: true,
      user: {
        id: student.id,
        studentCode: student.student_code,
        fullName: student.full_name,
        email: student.email,
        avatarUrl: student.avatar_url,
        subscriptionStatus: student.subscription_status,
        subscriptionEndDate: student.subscription_end_date,
      },
    })
  } catch (error) {
    console.error('Error verificando token SSO:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
