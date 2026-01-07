import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente con service role para operaciones admin (bypassa RLS)
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar que el usuario es admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const studentId = user.user_metadata?.student_id
  if (!studentId) return null

  const { data: student } = await serviceClient
    .from('students')
    .select('id, role')
    .eq('id', studentId)
    .single()

  if (!student || student.role !== 'admin') return null
  return student
}

// GET /api/admin/subscriptions - Lista de suscripciones
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const billingCycle = searchParams.get('billing_cycle') || ''
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Query base con join a students
    let query = serviceClient
      .from('subscriptions')
      .select(`
        id,
        student_id,
        payment_provider,
        external_subscription_id,
        price_cents,
        currency,
        billing_cycle,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        canceled_at,
        created_at,
        updated_at,
        student:students!student_id (
          id,
          full_name,
          email,
          generated_email,
          student_code,
          stripe_customer_id
        )
      `, { count: 'exact' })

    // Filtro de estado
    if (status) {
      query = query.eq('status', status)
    }

    // Filtro de ciclo de facturacion
    if (billingCycle) {
      query = query.eq('billing_cycle', billingCycle)
    }

    const { data: subscriptions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar suscripciones' },
        { status: 500 }
      )
    }

    // Si hay busqueda, filtrar en memoria (por nombre/email del estudiante)
    let filteredSubscriptions = subscriptions || []
    if (search && subscriptions) {
      const searchLower = search.toLowerCase()
      filteredSubscriptions = subscriptions.filter((sub: any) => {
        const student = sub.student
        if (!student) return false
        return (
          student.full_name?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.generated_email?.toLowerCase().includes(searchLower) ||
          student.student_code?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Obtener estadisticas adicionales
    const [activeCount, canceledCount, monthlyCount, yearlyCount, totalRevenue] = await Promise.all([
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled'),
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true }).eq('billing_cycle', 'monthly').eq('status', 'active'),
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true }).eq('billing_cycle', 'yearly').eq('status', 'active'),
      serviceClient.from('subscriptions').select('price_cents').eq('status', 'active')
    ])

    const mrr = totalRevenue.data?.reduce((sum, sub) => {
      return sum + (sub.price_cents || 0)
    }, 0) || 0

    return NextResponse.json({
      success: true,
      subscriptions: filteredSubscriptions,
      pagination: {
        page,
        limit,
        total: search ? filteredSubscriptions.length : (count || 0),
        totalPages: Math.ceil((search ? filteredSubscriptions.length : (count || 0)) / limit)
      },
      stats: {
        active: activeCount.count || 0,
        canceled: canceledCount.count || 0,
        monthly: monthlyCount.count || 0,
        yearly: yearlyCount.count || 0,
        mrr: mrr / 100 // Convertir centavos a dolares
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
