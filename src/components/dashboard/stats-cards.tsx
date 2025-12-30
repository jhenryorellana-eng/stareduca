'use client'

import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'

interface StatsCardsProps {
  stats: {
    totalEarnings: number
    pendingBalance: number
    totalReferrals: number
    activeReferrals: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Ganado',
      value: formatCurrency(stats.totalEarnings / 100),
      icon: DollarSign,
      iconBg: 'bg-green-600/20',
      iconColor: 'text-green-400',
      description: 'Ganancias totales',
    },
    {
      title: 'Balance Pendiente',
      value: formatCurrency(stats.pendingBalance / 100),
      icon: Clock,
      iconBg: 'bg-amber-600/20',
      iconColor: 'text-amber-400',
      description: 'Disponible para retiro',
    },
    {
      title: 'Total Referidos',
      value: stats.totalReferrals.toString(),
      icon: Users,
      iconBg: 'bg-indigo-600/20',
      iconColor: 'text-indigo-400',
      description: 'Usuarios referidos',
    },
    {
      title: 'Referidos Activos',
      value: stats.activeReferrals.toString(),
      icon: TrendingUp,
      iconBg: 'bg-purple-600/20',
      iconColor: 'text-purple-400',
      description: 'Con suscripción activa',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
