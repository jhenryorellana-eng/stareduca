import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, REFERRAL_STATUS } from '@/lib/constants'

export default async function ReferralsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener afiliado
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    redirect('/register')
  }

  // Obtener todos los referidos
  const { data: referrals } = await supabase
    .from('affiliate_referrals')
    .select(`
      id,
      status,
      created_at,
      converted_at,
      referred_user:profiles!affiliate_referrals_referred_user_id_fkey(
        username,
        avatar_url,
        subscription_status
      )
    `)
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  const getStatusStyle = (status: string) => {
    const config = REFERRAL_STATUS[status as keyof typeof REFERRAL_STATUS]
    return config ? `${config.bgColor} ${config.textColor}` : 'bg-slate-600 text-slate-300'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Referidos</h1>
        <p className="text-slate-400">
          Lista completa de usuarios que se registraron con tu link.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{referrals?.length || 0}</p>
            <p className="text-xs text-slate-400">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {referrals?.filter(r => r.status === 'converted').length || 0}
            </p>
            <p className="text-xs text-slate-400">Convertidos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {referrals?.filter(r => r.status === 'pending').length || 0}
            </p>
            <p className="text-xs text-slate-400">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">
              {referrals?.filter(r => r.status === 'expired' || r.status === 'cancelled').length || 0}
            </p>
            <p className="text-xs text-slate-400">Expirados</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Todos los Referidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg text-slate-400">Aún no tienes referidos</p>
              <p className="text-sm text-slate-500 mt-2">
                Comparte tu link de afiliado para empezar a ganar comisiones
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Registro</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Conversión</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Suscripción</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-slate-700/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                            {referral.referred_user?.avatar_url ? (
                              <img
                                src={referral.referred_user.avatar_url}
                                alt="Avatar"
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">
                                {referral.referred_user?.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-white">
                            @{referral.referred_user?.username || 'Usuario'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {formatDate(referral.created_at)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {referral.converted_at ? formatDate(referral.converted_at) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          referral.referred_user?.subscription_status === 'active'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-slate-600/20 text-slate-400'
                        }`}>
                          {referral.referred_user?.subscription_status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(referral.status)}`}>
                          {REFERRAL_STATUS[referral.status as keyof typeof REFERRAL_STATUS]?.label || referral.status}
                        </span>
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
