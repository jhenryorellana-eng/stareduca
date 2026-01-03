import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Middleware para verificar admin
async function verifyAdmin(authToken: string) {
  const { data: { user } } = await supabase.auth.getUser(authToken)
  if (!user) return null

  const studentId = user.user_metadata?.student_id
  if (!studentId) return null

  const { data: student } = await supabase
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
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(authToken)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
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
      supabase.from('students').select('id', { count: 'exact', head: true }),
      // Estudiantes activos
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      // Nuevos estudiantes (ultimos 7 dias)
      supabase.from('students').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      // Total cursos
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      // Cursos publicados
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      // Ingresos del mes
      supabase.from('payments')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', startOfMonth.toISOString()),
      // Pagos recientes
      supabase.from('payments')
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
      supabase.from('students')
        .select('id, full_name, student_code, created_at, subscription_status')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Calcular ingresos del mes
    const monthlyRevenue = monthlyRevenueResult.data?.reduce(
      (sum, p) => sum + (p.amount_cents || 0), 0
    ) || 0

    // Estadisticas de suscripciones por tipo
    const { data: subscriptionStats } = await supabase
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
