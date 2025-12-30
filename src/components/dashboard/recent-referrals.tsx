'use client'

import { Users, TrendingUp, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, REFERRAL_STATUS } from '@/lib/constants'
import Link from 'next/link'

interface Referral {
  id: string
  status: 'pending' | 'converted' | 'expired' | 'cancelled'
  created_at: string
  converted_at?: string
  referred_user?: {
    username?: string
    avatar_url?: string
  }
}

interface RecentReferralsProps {
  referrals: Referral[]
}

export function RecentReferrals({ referrals }: RecentReferralsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400" />
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  const getStatusStyle = (status: string) => {
    const config = REFERRAL_STATUS[status as keyof typeof REFERRAL_STATUS]
    return config ? `${config.bgColor} ${config.textColor}` : 'bg-slate-600 text-slate-300'
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Últimos Referidos
        </CardTitle>
        <Link
          href="/dashboard/referrals"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aún no tienes referidos</p>
            <p className="text-sm text-slate-500 mt-1">
              Comparte tu link para empezar a ganar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                    {referral.referred_user?.avatar_url ? (
                      <img
                        src={referral.referred_user.avatar_url}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400 text-sm font-medium">
                        {referral.referred_user?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      @{referral.referred_user?.username || 'Usuario'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(referral.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(referral.status)}
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(referral.status)}`}>
                    {REFERRAL_STATUS[referral.status as keyof typeof REFERRAL_STATUS]?.label || referral.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
