'use client'

import { DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, COMMISSION_STATUS } from '@/lib/constants'
import Link from 'next/link'

interface Commission {
  id: string
  commission_cents: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  created_at: string
  referral?: {
    referred_user?: {
      username?: string
    }
  }
}

interface RecentCommissionsProps {
  commissions: Commission[]
}

export function RecentCommissions({ commissions }: RecentCommissionsProps) {
  const getStatusStyle = (status: string) => {
    const config = COMMISSION_STATUS[status as keyof typeof COMMISSION_STATUS]
    return config ? `${config.bgColor} ${config.textColor}` : 'bg-slate-600 text-slate-300'
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Últimas Comisiones
        </CardTitle>
        <Link
          href="/dashboard/earnings"
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        {commissions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aún no tienes comisiones</p>
            <p className="text-sm text-slate-500 mt-1">
              Las comisiones aparecerán cuando tus referidos se suscriban
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-600/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Comisión de @{commission.referral?.referred_user?.username || 'Usuario'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(commission.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">
                    +{formatCurrency(commission.commission_cents / 100)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusStyle(commission.status)}`}>
                    {COMMISSION_STATUS[commission.status as keyof typeof COMMISSION_STATUS]?.label || commission.status}
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
