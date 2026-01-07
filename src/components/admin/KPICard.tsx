'use client'

import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface KPICardProps {
  label: string
  value: number
  format: 'currency' | 'percent' | 'number' | 'days'
  target?: number
  targetType?: 'min' | 'max' // min = must be >= target, max = must be <= target
  trend?: 'up' | 'down' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function KPICard({
  label,
  value,
  format,
  target,
  targetType = 'min',
  trend,
  size = 'md',
  className
}: KPICardProps) {
  // Format value based on type
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'percent':
        return `${value}%`
      case 'days':
        return `${value} días`
      case 'number':
      default:
        return value.toLocaleString('en-US')
    }
  }

  // Check if target is met
  const meetsTarget = () => {
    if (target === undefined) return null
    if (targetType === 'max') {
      return value <= target
    }
    return value >= target
  }

  const targetMet = meetsTarget()

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'neutral':
        return <Minus className="h-4 w-4 text-slate-400" />
    }
  }

  // Get target indicator
  const getTargetIndicator = () => {
    if (targetMet === null) return null
    if (targetMet) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <CheckCircle className="h-3 w-3" />
          <span>Meta: {targetType === 'max' ? '≤' : '≥'}{target}{format === 'percent' ? '%' : ''}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 text-xs text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        <span>Meta: {targetType === 'max' ? '≤' : '≥'}{target}{format === 'percent' ? '%' : ''}</span>
      </div>
    )
  }

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  }

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-slate-800/50 border border-slate-700/50',
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-400 line-clamp-1">{label}</p>
        {getTrendIcon()}
      </div>
      <p className={cn('font-bold text-white mt-1', valueSizeClasses[size])}>
        {formatValue()}
      </p>
      {target !== undefined && (
        <div className="mt-2">
          {getTargetIndicator()}
        </div>
      )}
    </div>
  )
}

// Executive Summary Card - Larger version for main KPIs
interface ExecutiveKPICardProps {
  label: string
  value: number
  format: 'currency' | 'percent' | 'number'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon: React.ReactNode
  iconBgColor: string
}

export function ExecutiveKPICard({
  label,
  value,
  format,
  trend,
  trendValue,
  icon,
  iconBgColor
}: ExecutiveKPICardProps) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'percent':
        return `${value}%`
      case 'number':
      default:
        return value.toLocaleString('en-US')
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      case 'neutral':
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{formatValue()}</p>
          {trend && trendValue && (
            <p className={cn('text-xs mt-1 flex items-center gap-1', getTrendColor())}>
              {getTrendIcon()}
              {trendValue}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBgColor)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
