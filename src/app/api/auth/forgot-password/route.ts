import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/resend'
import { hash } from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, studentCode } = body

    // Validar campos requeridos
    if (!email || !studentCode) {
      return NextResponse.json(
        { success: false, error: 'Email y codigo de estudiante son requeridos' },
        { status: 400 }
      )
    }

    // Normalizar email y codigo
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCode = studentCode.toUpperCase().trim()

    const supabase = createAdminClient()

    // Buscar estudiante por email personal Y codigo de estudiante
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, email, full_name, generated_email')
      .eq('email', normalizedEmail)
      .eq('student_code', normalizedCode)
      .single()

    // Siempre devolver el mismo mensaje para prevenir enumeracion de usuarios
    const successMessage = 'Si los datos son correctos, recibiras un email con instrucciones para recuperar tu contrasena.'

    if (studentError || !student) {
      // No revelar si el usuario existe o no
      console.log('Student not found or email/code mismatch')
      return NextResponse.json({
        success: true,
        message: successMessage
      })
    }

    // Invalidar tokens anteriores del mismo estudiante
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('student_id', student.id)

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = await hash(token, 12)

    // Calcular expiracion (1 hora)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Guardar token en la base de datos
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        student_id: student.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      })

    if (insertError) {
      console.error('Error inserting reset token:', insertError)
      return NextResponse.json(
        { success: false, error: 'Error al procesar la solicitud' },
        { status: 500 }
      )
    }

    // Construir URL de reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stareduca.ai'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Enviar email
    const emailResult = await sendPasswordResetEmail({
      to: student.email,
      fullName: student.full_name,
      resetUrl
    })

    if (!emailResult.success) {
      console.error('Error sending reset email:', emailResult.error)
      // Eliminar el token si el email falla
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('student_id', student.id)

      return NextResponse.json(
        { success: false, error: 'Error al enviar el email' },
        { status: 500 }
      )
    }

    console.log(`Password reset email sent to ${student.email}`)

    return NextResponse.json({
      success: true,
      message: successMessage
    })

  } catch (error) {
    console.error('Error in forgot-password:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
