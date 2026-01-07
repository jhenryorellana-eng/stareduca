import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { hash, compare } from 'bcryptjs'

// Validar que la contrasena cumpla los requisitos
function isValidPassword(password: string): boolean {
  // Minimo 8 caracteres, alfanumerico
  return password.length >= 8 && /^[a-zA-Z0-9]+$/.test(password)
}

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

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validar campos requeridos
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que las contrasenas nuevas coincidan
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Las contrasenas nuevas no coinciden' },
        { status: 400 }
      )
    }

    // Validar formato de contrasena nueva
    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'La nueva contrasena debe tener minimo 8 caracteres y solo letras y numeros' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Obtener estudiante con su password_hash
    const { data: student, error: studentError } = await adminClient
      .from('students')
      .select('id, password_hash, generated_email')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar contrasena actual
    const isCurrentPasswordValid = await compare(currentPassword, student.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'La contrasena actual es incorrecta' },
        { status: 400 }
      )
    }

    // Hash de la nueva contrasena
    const newPasswordHash = await hash(newPassword, 12)

    // Actualizar en la tabla students
    const { error: updateError } = await adminClient
      .from('students')
      .update({ password_hash: newPasswordHash })
      .eq('id', studentId)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la contrasena' },
        { status: 500 }
      )
    }

    // Actualizar en Supabase Auth
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (authUpdateError) {
      console.error('Error updating auth password:', authUpdateError)
      // La contrasena en students ya fue actualizada, continuar
    }

    console.log(`Password changed for student ${studentId}`)

    return NextResponse.json({
      success: true,
      message: 'Contrasena actualizada correctamente'
    })

  } catch (error) {
    console.error('Error in PATCH /api/settings/password:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
