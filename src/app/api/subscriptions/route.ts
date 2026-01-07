import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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

    // Obtener datos del estudiante
    const { data: student, error: studentError } = await adminClient
      .from('students')
      .select(`
        id,
        full_name,
        email,
        student_code,
        subscription_status,
        subscription_type,
        subscription_start_date,
        subscription_end_date,
        stripe_customer_id
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Obtener historial de pagos recientes
    const { data: payments } = await adminClient
      .from('payments')
      .select(`
        id,
        amount_cents,
        currency,
        status,
        payment_method,
        created_at
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calcular dias restantes
    let daysRemaining = null
    if (student.subscription_end_date) {
      const endDate = new Date(student.subscription_end_date)
      const now = new Date()
      daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Verificar si hay cancelación pendiente en Stripe
    let cancelAtPeriodEnd = false
    if (student.stripe_customer_id && student.subscription_status === 'active') {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: student.stripe_customer_id,
          status: 'active',
          limit: 1,
        })
        if (subscriptions.data.length > 0) {
          cancelAtPeriodEnd = subscriptions.data[0].cancel_at_period_end
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError)
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: student.subscription_status,
        type: student.subscription_type,
        startDate: student.subscription_start_date,
        endDate: student.subscription_end_date,
        daysRemaining,
        stripeCustomerId: student.stripe_customer_id,
        cancelAtPeriodEnd,
      },
      student: {
        id: student.id,
        fullName: student.full_name,
        email: student.email,
        studentCode: student.student_code,
      },
      payments: payments || []
    })

  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
