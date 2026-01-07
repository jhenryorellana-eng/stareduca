import { createClient, createAdminClient } from '@/lib/supabase/server'

interface StudentWithSubscription {
  id: string
  student_code: string
  role: string
  subscription_status: string | null
  subscription_end_date: string | null
}

/**
 * Verifica que el usuario tenga una suscripción activa.
 * Retorna el estudiante si tiene acceso, null si no.
 * Los admins siempre tienen acceso.
 */
export async function verifyActiveSubscription(): Promise<StudentWithSubscription | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const studentId = user.user_metadata?.student_id
    if (!studentId) return null

    const adminClient = createAdminClient()
    const { data: student } = await adminClient
      .from('students')
      .select('id, student_code, role, subscription_status, subscription_end_date')
      .eq('id', studentId)
      .single()

    if (!student) return null

    // Admins siempre tienen acceso
    if (student.role === 'admin') return student

    // Verificar suscripción activa
    if (student.subscription_status !== 'active') return null

    return student
  } catch (error) {
    console.error('Error verifying subscription:', error)
    return null
  }
}

/**
 * Verifica solo autenticación (para rutas que no requieren suscripción como /settings)
 */
export async function verifyAuthentication(): Promise<StudentWithSubscription | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const studentId = user.user_metadata?.student_id
    if (!studentId) return null

    const adminClient = createAdminClient()
    const { data: student } = await adminClient
      .from('students')
      .select('id, student_code, role, subscription_status, subscription_end_date')
      .eq('id', studentId)
      .single()

    return student || null
  } catch (error) {
    console.error('Error verifying authentication:', error)
    return null
  }
}
