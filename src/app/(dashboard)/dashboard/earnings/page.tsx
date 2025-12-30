import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, COMMISSION_STATUS } from '@/lib/constants'

export default async function EarningsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener afiliado
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, total_earnings_cents, pending_balance_cents, paid_balance_cents')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    redirect('/register')
  }

  // Obtener todas las comisiones
  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select(`
      id,
      amount_cents,
      commission_cents,
      commission_rate,
      status,
      period_start,
      period_end,
      created_at,
      referral:affiliate_referrals!affiliate_commissions_referral_id_fkey(
        referred_user:profiles!affiliate_referrals_referred_user_id_fkey(username, avatar_url)
      )
    `)
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  const getStatusStyle = (status: string) => {
    const config = COMMISSION_STATUS[status as keyof typeof COMMISSION_STATUS]
    return config ? `${config.bgColor} ${config.textColor}` : 'bg-slate-600 text-slate-300'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'approved':
        return <TrendingUp className="h-4 w-4 text-blue-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ganancias</h1>
        <p className="text-slate-400">
          Historial completo de tus comisiones por referidos.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600/20">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Ganado</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency((affiliate.total_earnings_cents || 0) / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-600/20">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pendiente de Pago</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency((affiliate.pending_balance_cents || 0) / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-600/20">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Pagado</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency((affiliate.paid_balance_cents || 0) / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Historial de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg text-slate-400">Aún no tienes comisiones</p>
              <p className="text-sm text-slate-500 mt-2">
                Las comisiones aparecerán cuando tus referidos se suscriban a Starbooks
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Referido</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Monto Suscripción</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Comisión (80%)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-slate-700/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                            {commission.referral?.referred_user?.avatar_url ? (
                              <img
                                src={commission.referral.referred_user.avatar_url}
                                alt="Avatar"
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">
                                {commission.referral?.referred_user?.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-white">
                            @{commission.referral?.referred_user?.username || 'Usuario'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {formatDate(commission.created_at)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-300">
                        {formatCurrency((commission.amount_cents || 0) / 100)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-green-400">
                          +{formatCurrency((commission.commission_cents || 0) / 100)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(commission.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(commission.status)}`}>
                            {COMMISSION_STATUS[commission.status as keyof typeof COMMISSION_STATUS]?.label || commission.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
