import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, cancelSubscription } from '@/lib/stripe'

export async function POST() {
  try {
    // Verificar autenticación
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
      .select('id, stripe_customer_id, subscription_status, subscription_end_date')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tiene suscripción activa
    if (student.subscription_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'No tienes una suscripcion activa para cancelar' },
        { status: 400 }
      )
    }

    // Verificar que tiene customer_id de Stripe
    if (!student.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'No se encontro informacion de pago' },
        { status: 400 }
      )
    }

    // Buscar la suscripción activa en Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: student.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontro suscripcion activa en Stripe' },
        { status: 400 }
      )
    }

    const stripeSubscription = subscriptions.data[0]

    // Si ya está programada para cancelar
    if (stripeSubscription.cancel_at_period_end) {
      return NextResponse.json(
        { success: false, error: 'La suscripcion ya esta programada para cancelarse' },
        { status: 400 }
      )
    }

    // Cancelar al final del período (no inmediatamente)
    await cancelSubscription(stripeSubscription.id, false)

    // Actualizar en la base de datos
    await adminClient
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('student_id', student.id)
      .eq('status', 'active')

    return NextResponse.json({
      success: true,
      message: 'Tu suscripcion se cancelara al final del periodo actual',
      cancelAt: student.subscription_end_date,
    })

  } catch (error) {
    console.error('Error in POST /api/subscriptions/cancel:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cancelar la suscripcion' },
      { status: 500 }
    )
  }
}
