import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/auth/me - Obtener estudiante actual
export async function GET() {
  try {
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

    const { data: student, error } = await serviceClient
      .from('students')
      .select(`
        id,
        email,
        generated_email,
        student_code,
        full_name,
        avatar_url,
        role,
        subscription_status,
        subscription_type,
        subscription_end_date,
        created_at
      `)
      .eq('id', studentId)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      student
    })

  } catch (error) {
    console.error('Error in GET /api/auth/me:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
