'use client'

import { cn } from '@/lib/utils'
import { KPICard } from './KPICard'
import { LucideIcon } from 'lucide-react'

interface KPIData {
  value: number
  format: 'currency' | 'percent' | 'number' | 'days'
  label: string
  target?: number
  targetType?: 'min' | 'max'
  trend?: 'up' | 'down' | 'neutral'
}

interface KPISectionProps {
  title: string
  icon: LucideIcon
  iconColor: string
  bgColor: string
  kpis: Record<string, KPIData>
  columns?: 2 | 3 | 4
  className?: string
}

export function KPISection({
  title,
  icon: Icon,
  iconColor,
  bgColor,
  kpis,
  columns = 2,
  className
}: KPISectionProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn('p-4 rounded-xl bg-slate-800/30 border border-slate-700/30', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className={cn('p-1.5 rounded-lg', bgColor)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h3>
      </div>
      <div className={cn('grid gap-3', gridCols[columns])}>
        {Object.entries(kpis).map(([key, kpi]) => (
          <KPICard
            key={key}
            label={kpi.label}
            value={kpi.value}
            format={kpi.format}
            target={kpi.target}
            targetType={kpi.targetType}
            trend={kpi.trend}
            size="sm"
          />
        ))}
      </div>
    </div>
  )
}

// Top Affiliates list component
interface TopAffiliate {
  name: string
  earnings: number
  referrals: number
}

interface TopAffiliatesListProps {
  affiliates: TopAffiliate[]
  className?: string
}

export function TopAffiliatesList({ affiliates, className }: TopAffiliatesListProps) {
  if (!affiliates || affiliates.length === 0) {
    return (
      <div className={cn('text-sm text-slate-400 text-center py-4', className)}>
        Sin afiliados activos
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-slate-500 uppercase tracking-wide">Top Afiliados</p>
      {affiliates.slice(0, 3).map((affiliate, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
            <span className="text-sm text-white truncate">{affiliate.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">${affiliate.earnings.toFixed(2)}</span>
            <span className="text-slate-400">{affiliate.referrals} refs</span>
          </div>
        </div>
      ))}
    </div>
  )
}
