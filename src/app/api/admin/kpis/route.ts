import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// GET /api/admin/kpis - KPIs completos del dashboard
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // ============================================
    // CONSULTAS EN PARALELO
    // ============================================
    const [
      // ENGAGEMENT
      totalProgressResult,
      completedProgressResult,
      activeStudentsToday,
      activeStudentsMonth,
      progressAvgResult,

      // RETENCIÓN
      activeStudentsStartMonth,
      newStudentsThisMonth,
      canceledThisMonth,
      pendingCancellations,
      avgSubscriptionDays,

      // FINANCIEROS
      activeSubs,
      monthlyRevenue,
      failedPayments,
      totalPaymentsMonth,
      yearlySubsCount,

      // ACADÉMICOS
      examAttemptsResult,
      coursesCompletedResult,

      // AFILIADOS
      affiliateCommissions,
      affiliateClicks,
      topAffiliates,

      // COMUNIDAD
      postsToday,
      totalPostsMonth,
      totalReactionsMonth,
      totalCommentsMonth,
      uniqueAuthors,

      // CONVERSIÓN
      pendingRegsCompleted,
      pendingRegsTotal,
      newStudentsWeek,

      // TOTALES
      totalStudents,
      totalActiveStudents
    ] = await Promise.all([
      // ENGAGEMENT
      serviceClient.from('student_progress').select('id', { count: 'exact', head: true }),
      serviceClient.from('student_progress').select('id', { count: 'exact', head: true }).not('completed_at', 'is', null),
      serviceClient.from('students').select('id', { count: 'exact', head: true }).gte('last_login_at', today.toISOString()),
      serviceClient.from('students').select('id', { count: 'exact', head: true }).gte('last_login_at', thirtyDaysAgo.toISOString()),
      serviceClient.from('student_progress').select('progress_percentage'),

      // RETENCIÓN - Estudiantes activos al inicio del mes
      serviceClient.from('students').select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'active')
        .lt('created_at', startOfMonth.toISOString()),
      serviceClient.from('students').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true })
        .not('canceled_at', 'is', null)
        .gte('canceled_at', startOfMonth.toISOString()),
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true })
        .eq('cancel_at_period_end', true)
        .eq('status', 'active'),
      serviceClient.from('students').select('subscription_start_date')
        .eq('subscription_status', 'active')
        .not('subscription_start_date', 'is', null),

      // FINANCIEROS
      serviceClient.from('subscriptions').select('price_cents, billing_cycle').eq('status', 'active'),
      serviceClient.from('payments').select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('payments').select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('payments').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('subscriptions').select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('billing_cycle', 'yearly'),

      // ACADÉMICOS
      serviceClient.from('exam_attempts').select('percentage, passed, student_id, exam_id'),
      serviceClient.from('student_progress').select('id', { count: 'exact', head: true }).not('completed_at', 'is', null),

      // AFILIADOS
      serviceClient.from('affiliate_commissions').select('commission_cents')
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('affiliate_link_clicks').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('affiliates').select('id, referral_code, total_earnings_cents, link_clicks, referral_count, student:students!student_id(full_name)')
        .eq('is_active', true)
        .order('total_earnings_cents', { ascending: false })
        .limit(5),

      // COMUNIDAD
      serviceClient.from('posts').select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      serviceClient.from('posts').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('reactions').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('comments').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('posts').select('author_id')
        .gte('created_at', startOfMonth.toISOString()),

      // CONVERSIÓN
      serviceClient.from('pending_registrations').select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('pending_registrations').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      serviceClient.from('students').select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),

      // TOTALES
      serviceClient.from('students').select('id', { count: 'exact', head: true }),
      serviceClient.from('students').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active')
    ])

    // ============================================
    // CÁLCULOS ENGAGEMENT
    // ============================================
    const totalProgress = totalProgressResult.count || 0
    const completedProgress = completedProgressResult.count || 0
    const completionRate = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0

    const dau = activeStudentsToday.count || 0
    const mau = activeStudentsMonth.count || 0
    const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0

    const progressData = progressAvgResult.data || []
    const avgProgress = progressData.length > 0
      ? Math.round(progressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / progressData.length)
      : 0

    // ============================================
    // CÁLCULOS RETENCIÓN
    // ============================================
    const activeStart = activeStudentsStartMonth.count || 0
    const newThisMonth = newStudentsThisMonth.count || 0
    const activeNow = totalActiveStudents.count || 0
    const retentionRate = activeStart > 0
      ? Math.round(((activeNow - newThisMonth) / activeStart) * 100)
      : 100

    const canceled = canceledThisMonth.count || 0
    const churnRate = activeStart > 0 ? Math.round((canceled / activeStart) * 100 * 10) / 10 : 0

    const pendingCancel = pendingCancellations.count || 0

    // Días promedio suscrito
    const subDates = avgSubscriptionDays.data || []
    let avgDaysSubscribed = 0
    if (subDates.length > 0) {
      const totalDays = subDates.reduce((sum, s) => {
        if (s.subscription_start_date) {
          const start = new Date(s.subscription_start_date)
          const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          return sum + diff
        }
        return sum
      }, 0)
      avgDaysSubscribed = Math.round(totalDays / subDates.length)
    }

    // ============================================
    // CÁLCULOS FINANCIEROS
    // ============================================
    const activeSubscriptions = activeSubs.data || []

    // MRR: Para yearly, dividir entre 12
    let mrr = 0
    activeSubscriptions.forEach(sub => {
      if (sub.billing_cycle === 'yearly') {
        mrr += (sub.price_cents || 0) / 12
      } else {
        mrr += sub.price_cents || 0
      }
    })
    mrr = Math.round(mrr) / 100 // Convertir a dólares

    const arr = Math.round(mrr * 12 * 100) / 100

    const activeCount = activeSubscriptions.length
    const arpu = activeCount > 0 ? Math.round((mrr / activeCount) * 100) / 100 : 0

    const monthRevenue = (monthlyRevenue.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100

    const failedCount = failedPayments.count || 0
    const totalPayments = totalPaymentsMonth.count || 0
    const failedRate = totalPayments > 0 ? Math.round((failedCount / totalPayments) * 100 * 10) / 10 : 0

    const yearlyCount = yearlySubsCount.count || 0

    // ============================================
    // CÁLCULOS ACADÉMICOS
    // ============================================
    const examData = examAttemptsResult.data || []
    const avgExamScore = examData.length > 0
      ? Math.round(examData.reduce((sum, e) => sum + (e.percentage || 0), 0) / examData.length)
      : 0

    const passedExams = examData.filter(e => e.passed).length
    const approvalRate = examData.length > 0 ? Math.round((passedExams / examData.length) * 100) : 0

    const coursesCompleted = coursesCompletedResult.count || 0

    // Intentos por examen (promedio)
    const examsByStudent: Record<string, number> = {}
    examData.forEach(e => {
      const key = `${e.student_id}-${e.exam_id}`
      examsByStudent[key] = (examsByStudent[key] || 0) + 1
    })
    const attemptCounts = Object.values(examsByStudent)
    const avgAttempts = attemptCounts.length > 0
      ? Math.round((attemptCounts.reduce((a, b) => a + b, 0) / attemptCounts.length) * 10) / 10
      : 0

    // ============================================
    // CÁLCULOS AFILIADOS
    // ============================================
    const commissions = affiliateCommissions.data || []
    const affiliateRevenue = commissions.reduce((sum, c) => sum + (c.commission_cents || 0), 0) / 100

    const clicks = affiliateClicks.count || 0

    // Tasa de conversión de afiliados
    const topAffs = topAffiliates.data || []
    const totalReferrals = topAffs.reduce((sum, a) => sum + (a.referral_count || 0), 0)
    const totalClicks = topAffs.reduce((sum, a) => sum + (a.link_clicks || 0), 0)
    const affiliateConversionRate = totalClicks > 0 ? Math.round((totalReferrals / totalClicks) * 100 * 10) / 10 : 0

    // ============================================
    // CÁLCULOS COMUNIDAD
    // ============================================
    const postsDay = postsToday.count || 0
    const postsMonth = totalPostsMonth.count || 0
    const reactionsMonth = totalReactionsMonth.count || 0
    const commentsMonth = totalCommentsMonth.count || 0

    const engagementRate = postsMonth > 0
      ? Math.round(((reactionsMonth + commentsMonth) / postsMonth) * 100)
      : 0

    const authorsData = uniqueAuthors.data || []
    const uniqueAuthorIds = new Set(authorsData.map(p => p.author_id))
    const total = totalStudents.count || 1
    const participationRate = Math.round((uniqueAuthorIds.size / total) * 100)

    // ============================================
    // CÁLCULOS CONVERSIÓN
    // ============================================
    const regsCompleted = pendingRegsCompleted.count || 0
    const regsTotal = pendingRegsTotal.count || 0
    const conversionRate = regsTotal > 0 ? Math.round((regsCompleted / regsTotal) * 100) : 0

    const pendingRegs = regsTotal - regsCompleted
    const newWeek = newStudentsWeek.count || 0

    // ============================================
    // RESPUESTA ESTRUCTURADA
    // ============================================
    return NextResponse.json({
      success: true,
      kpis: {
        // RESUMEN EJECUTIVO
        executive: {
          mrr: { value: mrr, trend: 'up', format: 'currency' },
          activeUsers: { value: activeCount, trend: 'up', format: 'number' },
          churnRate: { value: churnRate, target: 5, format: 'percent' },
          coursesCompleted: { value: coursesCompleted, trend: 'up', format: 'number' }
        },

        // ENGAGEMENT
        engagement: {
          completionRate: { value: completionRate, target: 70, format: 'percent', label: 'Tasa de Finalización' },
          dauMauRatio: { value: dauMauRatio, target: 20, format: 'percent', label: 'DAU/MAU' },
          avgProgress: { value: avgProgress, target: 50, format: 'percent', label: 'Progreso Promedio' },
          activeToday: { value: dau, format: 'number', label: 'Activos Hoy' }
        },

        // RETENCIÓN
        retention: {
          retentionRate: { value: retentionRate, target: 90, format: 'percent', label: 'Retención Mensual' },
          churnRate: { value: churnRate, target: 5, targetType: 'max', format: 'percent', label: 'Churn Rate' },
          pendingCancellations: { value: pendingCancel, format: 'number', label: 'Cancelaciones Pendientes' },
          avgDaysSubscribed: { value: avgDaysSubscribed, target: 180, format: 'days', label: 'Días Promedio' }
        },

        // FINANCIEROS
        financial: {
          mrr: { value: mrr, format: 'currency', label: 'MRR' },
          arr: { value: arr, format: 'currency', label: 'ARR' },
          arpu: { value: arpu, format: 'currency', label: 'ARPU' },
          monthRevenue: { value: monthRevenue, format: 'currency', label: 'Ingresos del Mes' },
          failedPayments: { value: failedRate, target: 5, targetType: 'max', format: 'percent', label: 'Pagos Fallidos' },
          yearlySubscriptions: { value: yearlyCount, format: 'number', label: 'Suscripciones Anuales' }
        },

        // ACADÉMICOS
        academic: {
          avgScore: { value: avgExamScore, target: 75, format: 'percent', label: 'Calificación Promedio' },
          approvalRate: { value: approvalRate, target: 80, format: 'percent', label: 'Tasa de Aprobación' },
          coursesCompleted: { value: coursesCompleted, format: 'number', label: 'Cursos Completados' },
          avgAttempts: { value: avgAttempts, target: 2, targetType: 'max', format: 'number', label: 'Intentos Promedio' }
        },

        // AFILIADOS
        affiliates: {
          revenue: { value: affiliateRevenue, format: 'currency', label: 'Comisiones del Mes' },
          conversionRate: { value: affiliateConversionRate, target: 5, format: 'percent', label: 'Tasa de Conversión' },
          clicks: { value: clicks, format: 'number', label: 'Clicks del Mes' },
          topAffiliates: topAffs.map(a => ({
            name: (a.student as any)?.full_name || 'N/A',
            earnings: (a.total_earnings_cents || 0) / 100,
            referrals: a.referral_count || 0
          }))
        },

        // COMUNIDAD
        community: {
          postsToday: { value: postsDay, format: 'number', label: 'Posts Hoy' },
          engagementRate: { value: engagementRate, target: 50, format: 'percent', label: 'Engagement' },
          participationRate: { value: participationRate, target: 20, format: 'percent', label: 'Participación' }
        },

        // CONVERSIÓN
        conversion: {
          registrationRate: { value: conversionRate, target: 70, format: 'percent', label: 'Conversión Registro' },
          pendingRegistrations: { value: pendingRegs, format: 'number', label: 'Pendientes' },
          newStudentsWeek: { value: newWeek, format: 'number', label: 'Nuevos/Semana' }
        }
      },

      // Metadatos
      meta: {
        generatedAt: now.toISOString(),
        period: {
          start: startOfMonth.toISOString(),
          end: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/kpis:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
