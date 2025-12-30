import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ReferralLinkCard } from '@/components/dashboard/referral-link-card'
import { RecentReferrals } from '@/components/dashboard/recent-referrals'
import { RecentCommissions } from '@/components/dashboard/recent-commissions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener datos del afiliado
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select(`
      *,
      app:apps!affiliates_app_id_fkey(name, slug)
    `)
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    redirect('/register')
  }

  // Obtener referidos recientes
  const { data: referralsRaw } = await supabase
    .from('affiliate_referrals')
    .select(`
      id,
      status,
      created_at,
      converted_at,
      referred_user:profiles!affiliate_referrals_referred_user_id_fkey(username, avatar_url)
    `)
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Transformar referrals - Supabase devuelve relaciones como arrays
  const referrals = (referralsRaw || []).map(r => ({
    ...r,
    referred_user: (r.referred_user as { username: string; avatar_url: string }[] | null)?.[0]
  }))

  // Obtener comisiones recientes
  const { data: commissionsRaw } = await supabase
    .from('affiliate_commissions')
    .select(`
      id,
      commission_cents,
      status,
      created_at,
      referral:affiliate_referrals!affiliate_commissions_referral_id_fkey(
        referred_user:profiles!affiliate_referrals_referred_user_id_fkey(username)
      )
    `)
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Transformar commissions - Supabase devuelve relaciones anidadas como arrays
  const commissions = (commissionsRaw || []).map(c => ({
    ...c,
    referral: {
      referred_user: (c.referral as { referred_user: { username: string }[] }[] | null)?.[0]?.referred_user?.[0]
    }
  }))

  // Contar referidos activos (con suscripción activa)
  const { count: activeReferralsCount } = await supabase
    .from('affiliate_referrals')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'converted')

  const stats = {
    totalEarnings: affiliate.total_earnings_cents || 0,
    pendingBalance: affiliate.pending_balance_cents || 0,
    totalReferrals: affiliate.referral_count || 0,
    activeReferrals: activeReferralsCount || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">
          Bienvenido de vuelta. Aquí está el resumen de tu actividad.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <ReferralLinkCard
            referralCode={affiliate.referral_code}
            appSlug={(affiliate.app as { slug: string; name: string }[] | null)?.[0]?.slug || 'starbooks'}
            linkClicks={affiliate.link_clicks || 0}
          />
          <RecentReferrals referrals={referrals} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <RecentCommissions commissions={commissions} />

          {/* Quick Tips Card */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/30">
            <h3 className="text-lg font-semibold text-white mb-3">
              Consejos para ganar más
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Comparte tu link en redes sociales con una reseña personal
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Crea contenido sobre los libros que has leído
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Menciona los beneficios de Starbooks a tus seguidores
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Usa el código QR en eventos presenciales
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
