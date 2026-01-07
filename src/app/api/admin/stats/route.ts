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

// GET /api/admin/stats - Estadisticas del dashboard
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Obtener estadisticas en paralelo
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalStudentsResult,
      activeStudentsResult,
      newStudentsResult,
      totalCoursesResult,
      publishedCoursesResult,
      monthlyRevenueResult,
      recentPaymentsResult,
      recentSignupsResult
    ] = await Promise.all([
      // Total estudiantes
      serviceClient.from('students').select('id', { count: 'exact', head: true }),
      // Estudiantes activos
      serviceClient.from('students').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      // Nuevos estudiantes (ultimos 7 dias)
      serviceClient.from('students').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      // Total cursos
      serviceClient.from('courses').select('id', { count: 'exact', head: true }),
      // Cursos publicados
      serviceClient.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      // Ingresos del mes
      serviceClient.from('payments')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', startOfMonth.toISOString()),
      // Pagos recientes
      serviceClient.from('payments')
        .select(`
          id,
          amount_cents,
          status,
          created_at,
          student:students!student_id (
            full_name,
            student_code
          )
        `)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(5),
      // Registros recientes
      serviceClient.from('students')
        .select('id, full_name, student_code, created_at, subscription_status')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Calcular ingresos del mes
    const monthlyRevenue = monthlyRevenueResult.data?.reduce(
      (sum, p) => sum + (p.amount_cents || 0), 0
    ) || 0

    // Estadisticas de suscripciones por tipo
    const { data: subscriptionStats } = await serviceClient
      .from('students')
      .select('subscription_type')
      .eq('subscription_status', 'active')

    const subscriptionsByType = {
      monthly: subscriptionStats?.filter(s => s.subscription_type === 'monthly').length || 0,
      yearly: subscriptionStats?.filter(s => s.subscription_type === 'yearly').length || 0
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: totalStudentsResult.count || 0,
        activeStudents: activeStudentsResult.count || 0,
        newStudentsThisWeek: newStudentsResult.count || 0,
        totalCourses: totalCoursesResult.count || 0,
        publishedCourses: publishedCoursesResult.count || 0,
        monthlyRevenue: monthlyRevenue / 100,
        subscriptionsByType
      },
      recentPayments: recentPaymentsResult.data?.map(p => ({
        ...p,
        amount: p.amount_cents / 100
      })) || [],
      recentSignups: recentSignupsResult.data || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
