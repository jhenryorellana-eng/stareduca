import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hash, compare } from 'bcryptjs'

// Validar que la contrasena cumpla los requisitos
function isValidPassword(password: string): boolean {
  // Minimo 8 caracteres, alfanumerico
  return password.length >= 8 && /^[a-zA-Z0-9]+$/.test(password)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = body

    // Validar campos requeridos
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que las contrasenas coincidan
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Las contrasenas no coinciden' },
        { status: 400 }
      )
    }

    // Validar formato de contrasena
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'La contrasena debe tener minimo 8 caracteres y solo letras y numeros' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar tokens no usados y no expirados
    const { data: tokens, error: tokensError } = await supabase
      .from('password_reset_tokens')
      .select('id, student_id, token_hash, expires_at')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
      return NextResponse.json(
        { success: false, error: 'Error al procesar la solicitud' },
        { status: 500 }
      )
    }

    // Buscar el token que coincida
    let validToken = null
    for (const t of tokens || []) {
      const isValid = await compare(token, t.token_hash)
      if (isValid) {
        validToken = t
        break
      }
    }

    if (!validToken) {
      return NextResponse.json(
        { success: false, error: 'El enlace es invalido o ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // Obtener datos del estudiante
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, generated_email')
      .eq('id', validToken.student_id)
      .single()

    if (studentError || !student) {
      console.error('Student not found:', studentError)
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash de la nueva contrasena
    const passwordHash = await hash(password, 12)

    // Actualizar contrasena en la tabla students
    const { error: updateError } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('id', student.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la contrasena' },
        { status: 500 }
      )
    }

    // Actualizar contrasena en Supabase Auth
    // Primero obtener el usuario de auth por email
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users.find(u => u.email === student.generated_email)

    if (authUser) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password }
      )

      if (authUpdateError) {
        console.error('Error updating auth password:', authUpdateError)
        // Continuar aunque falle el auth, la contrasena en students ya fue actualizada
      }
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', validToken.id)

    console.log(`Password reset successful for student ${student.id}`)

    return NextResponse.json({
      success: true,
      message: 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.'
    })

  } catch (error) {
    console.error('Error in reset-password:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
