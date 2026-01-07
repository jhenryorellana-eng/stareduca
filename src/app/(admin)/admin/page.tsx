'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  UserPlus,
  BookOpen,
  Loader2,
  ArrowRight,
  CreditCard,
  Activity,
  UserCheck,
  BarChart3,
  Wallet,
  Award,
  Share2,
  MessageSquare,
  UserCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExecutiveKPICard } from '@/components/admin/KPICard'
import { KPISection, TopAffiliatesList } from '@/components/admin/KPISection'

interface KPIs {
  executive: {
    mrr: { value: number; trend: string; format: string }
    activeUsers: { value: number; trend: string; format: string }
    churnRate: { value: number; target: number; format: string }
    coursesCompleted: { value: number; trend: string; format: string }
  }
  engagement: Record<string, any>
  retention: Record<string, any>
  financial: Record<string, any>
  academic: Record<string, any>
  affiliates: Record<string, any> & { topAffiliates: Array<{ name: string; earnings: number; referrals: number }> }
  community: Record<string, any>
  conversion: Record<string, any>
}

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
  student: {
    full_name: string
    student_code: string
  }
}

interface Signup {
  id: string
  full_name: string
  student_code: string
  created_at: string
  subscription_status: string
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [recentSignups, setRecentSignups] = useState<Signup[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [kpisResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/kpis'),
        fetch('/api/admin/stats')
      ])

      const kpisData = await kpisResponse.json()
      const statsData = await statsResponse.json()

      if (kpisData.success) {
        setKpis(kpisData.kpis)
        setLastUpdated(new Date())
      }

      if (statsData.success) {
        setRecentPayments(statsData.recentPayments)
        setRecentSignups(statsData.recentSignups)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="text-center py-8 text-slate-400">
        Error al cargar los KPIs
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-1">
              Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Actualizar
          </Button>
          <Link href="/admin/courses/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <BookOpen className="h-4 w-4 mr-2" />
              Nuevo curso
            </Button>
          </Link>
        </div>
      </div>

      {/* Executive Summary - 4 main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKPICard
          label="MRR"
          value={kpis.executive.mrr.value}
          format="currency"
          trend="up"
          trendValue="Este mes"
          icon={<DollarSign className="h-6 w-6 text-green-400" />}
          iconBgColor="bg-green-500/20"
        />
        <ExecutiveKPICard
          label="Usuarios Activos"
          value={kpis.executive.activeUsers.value}
          format="number"
          trend="up"
          trendValue="Suscripciones activas"
          icon={<Users className="h-6 w-6 text-indigo-400" />}
          iconBgColor="bg-indigo-500/20"
        />
        <ExecutiveKPICard
          label="Churn Rate"
          value={kpis.executive.churnRate.value}
          format="percent"
          trend={kpis.executive.churnRate.value <= kpis.executive.churnRate.target ? 'up' : 'down'}
          trendValue={kpis.executive.churnRate.value <= kpis.executive.churnRate.target ? 'Bajo control' : 'Revisar'}
          icon={<Activity className="h-6 w-6 text-amber-400" />}
          iconBgColor="bg-amber-500/20"
        />
        <ExecutiveKPICard
          label="Cursos Completados"
          value={kpis.executive.coursesCompleted.value}
          format="number"
          trend="up"
          trendValue="Total acumulado"
          icon={<GraduationCap className="h-6 w-6 text-purple-400" />}
          iconBgColor="bg-purple-500/20"
        />
      </div>

      {/* KPI Sections - 3 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ENGAGEMENT */}
        <KPISection
          title="Engagement"
          icon={Activity}
          iconColor="text-green-400"
          bgColor="bg-green-500/20"
          kpis={kpis.engagement}
          columns={2}
        />

        {/* RETENCIÓN */}
        <KPISection
          title="Retención"
          icon={UserCheck}
          iconColor="text-blue-400"
          bgColor="bg-blue-500/20"
          kpis={kpis.retention}
          columns={2}
        />

        {/* FINANCIEROS */}
        <KPISection
          title="Financieros"
          icon={Wallet}
          iconColor="text-purple-400"
          bgColor="bg-purple-500/20"
          kpis={kpis.financial}
          columns={2}
        />

        {/* ACADÉMICOS */}
        <KPISection
          title="Académicos"
          icon={Award}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/20"
          kpis={kpis.academic}
          columns={2}
        />

        {/* AFILIADOS */}
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-yellow-500/20">
              <Share2 className="h-4 w-4 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Afiliados</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {Object.entries(kpis.affiliates).filter(([key]) => key !== 'topAffiliates').map(([key, kpi]: [string, any]) => (
              <div key={key} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-400 line-clamp-1">{kpi.label}</p>
                <p className="text-xl font-bold text-white mt-1">
                  {kpi.format === 'currency' ? `$${kpi.value.toFixed(2)}` :
                   kpi.format === 'percent' ? `${kpi.value}%` :
                   kpi.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <TopAffiliatesList affiliates={kpis.affiliates.topAffiliates} />
        </div>

        {/* COMUNIDAD */}
        <KPISection
          title="Comunidad"
          icon={MessageSquare}
          iconColor="text-red-400"
          bgColor="bg-red-500/20"
          kpis={kpis.community}
          columns={3}
        />
      </div>

      {/* CONVERSIÓN - Full width */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-slate-500/20">
            <UserCircle className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Conversión</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(kpis.conversion).map(([key, kpi]: [string, any]) => (
            <div key={key} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-sm text-slate-400">{kpi.label}</p>
              <p className="text-2xl font-bold text-white mt-1">
                {kpi.format === 'percent' ? `${kpi.value}%` : kpi.value.toLocaleString()}
              </p>
              {kpi.target && (
                <p className={cn(
                  'text-xs mt-1',
                  kpi.value >= kpi.target ? 'text-green-400' : 'text-amber-400'
                )}>
                  Meta: {kpi.target}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pagos recientes</h3>
            <Link href="/admin/subscriptions" className="text-sm text-indigo-400 hover:text-indigo-300">
              Ver todos
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-center py-8 text-slate-400">No hay pagos recientes</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CreditCard className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{payment.student.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-400">+${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Registros recientes</h3>
            <Link href="/admin/students" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentSignups.length === 0 ? (
            <p className="text-center py-8 text-slate-400">No hay registros recientes</p>
          ) : (
            <div className="space-y-3">
              {recentSignups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <UserPlus className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{signup.full_name}</p>
                      <p className="text-xs text-indigo-400">{signup.student_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-xs",
                      signup.subscription_status === 'active'
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-500/20 text-slate-400"
                    )}>
                      {signup.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(signup.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
