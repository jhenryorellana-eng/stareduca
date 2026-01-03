// ============================================================================
// API: SSO - AUTENTICACION SINGLE SIGN-ON
// POST /api/auth/sso
// Starbooks llama a este endpoint para autenticar un usuario de StarEduca
// Retorna un token temporal que Starbooks puede verificar
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { compare } from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentCode, password, appId } = body

    // Validaciones
    if (!studentCode || !password) {
      return NextResponse.json(
        { success: false, error: 'Codigo de estudiante y contrasena requeridos' },
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

    // Normalizar codigo de estudiante
    let normalizedCode = studentCode.toUpperCase()
    // Si viene sin guion, agregar el guion
    if (/^[A-Z]{3}\d{6}$/.test(normalizedCode)) {
      normalizedCode = `${normalizedCode.slice(0, 3)}-${normalizedCode.slice(3)}`
    }

    // Buscar estudiante por codigo
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_code, email, full_name, password_hash, subscription_status, subscription_end_date, avatar_url')
      .eq('student_code', normalizedCode)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Codigo de estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar contrasena
    const passwordValid = await compare(password, student.password_hash)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Contrasena incorrecta' },
        { status: 401 }
      )
    }

    // Verificar que la suscripcion este activa
    if (student.subscription_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'La suscripcion no esta activa' },
        { status: 403 }
      )
    }

    // Generar token SSO temporal (5 minutos de validez)
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos

    // Guardar token en la base de datos
    const { error: tokenError } = await supabase.from('sso_tokens').insert({
      token,
      student_id: student.id,
      app_id: appId || 'starbooks',
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (tokenError) {
      console.error('Error al crear token SSO:', tokenError)
      return NextResponse.json(
        { success: false, error: 'Error al generar token de autenticacion' },
        { status: 500 }
      )
    }

    // Retornar token y datos basicos del usuario
    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        studentCode: student.student_code,
        fullName: student.full_name,
        email: student.email,
        avatarUrl: student.avatar_url,
        subscriptionStatus: student.subscription_status,
        subscriptionEndDate: student.subscription_end_date,
      },
    })
  } catch (error) {
    console.error('Error en SSO:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
