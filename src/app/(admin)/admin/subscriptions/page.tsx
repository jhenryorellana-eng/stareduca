'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Loader2,
  CreditCard,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Subscription {
  id: string
  student_id: string
  payment_provider: string
  external_subscription_id: string | null
  price_cents: number
  currency: string
  billing_cycle: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
  student: {
    id: string
    full_name: string
    email: string | null
    generated_email: string
    student_code: string
    stripe_customer_id: string | null
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  active: number
  canceled: number
  monthly: number
  yearly: number
  mrr: number
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState<Stats>({
    active: 0,
    canceled: 0,
    monthly: 0,
    yearly: 0,
    mrr: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')

  const fetchSubscriptions = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (cycleFilter) params.set('billing_cycle', cycleFilter)

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      const data = await response.json()

      if (data.success) {
        setSubscriptions(data.subscriptions)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => fetchSubscriptions(1), 300)
    return () => clearTimeout(timeout)
  }, [search, statusFilter, cycleFilter])

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge className="bg-amber-500/20 text-amber-400">Cancela al final</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">Activa</Badge>
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400">Cancelada</Badge>
      case 'past_due':
        return <Badge className="bg-amber-500/20 text-amber-400">Pago pendiente</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-400">Prueba</Badge>
      case 'inactive':
        return <Badge className="bg-slate-500/20 text-slate-400">Inactiva</Badge>
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '--'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100
    if (currency === 'PEN') {
      return `S/${amount.toFixed(2)}`
    }
    return `$${amount.toFixed(2)}`
  }

  const getStripeUrl = (subscriptionId: string | null) => {
    if (!subscriptionId) return null
    return `https://dashboard.stripe.com/subscriptions/${subscriptionId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Suscripciones</h1>
          <p className="text-sm text-slate-400">Gestiona las suscripciones de los estudiantes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-sm text-slate-400">Activas</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.canceled}</p>
              <p className="text-sm text-slate-400">Canceladas</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.monthly}</p>
              <p className="text-sm text-slate-400">Mensuales</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.yearly}</p>
              <p className="text-sm text-slate-400">Anuales</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${stats.mrr.toFixed(2)}</p>
              <p className="text-sm text-slate-400">MRR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o codigo..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white outline-none focus:border-indigo-500/50"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="canceled">Canceladas</option>
            <option value="past_due">Pago pendiente</option>
            <option value="trialing">En prueba</option>
          </select>

          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white outline-none focus:border-indigo-500/50"
          >
            <option value="">Todos los ciclos</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {search || statusFilter || cycleFilter ? 'No se encontraron suscripciones' : 'No hay suscripciones'}
          </h3>
          <p className="text-slate-400">
            {search || statusFilter || cycleFilter ? 'Intenta con otros filtros' : 'Las suscripciones apareceran aqui cuando los estudiantes se suscriban'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-slate-800/50 border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Estudiante</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Periodo</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {subscription.student?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {subscription.student?.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {subscription.student?.email || subscription.student?.generated_email}
                          </p>
                          <code className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-indigo-300">
                            {subscription.student?.student_code}
                          </code>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-white">
                          {formatPrice(subscription.price_cents, subscription.currency)}
                          <span className="text-slate-400 text-sm font-normal">
                            /{subscription.billing_cycle === 'monthly' ? 'mes' : 'ano'}
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-500/20 text-indigo-300 capitalize">
                            {subscription.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                          </Badge>
                          <span className="text-xs text-slate-500 capitalize">
                            {subscription.payment_provider}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                        {subscription.canceled_at && (
                          <p className="text-xs text-slate-500">
                            Cancelada: {formatDate(subscription.canceled_at)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span>Inicio: {formatDate(subscription.current_period_start)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>Fin: {formatDate(subscription.current_period_end)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {subscription.external_subscription_id && subscription.payment_provider === 'stripe' && (
                        <a
                          href={getStripeUrl(subscription.external_subscription_id) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Stripe
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4">
              <p className="text-sm text-slate-400">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSubscriptions(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-400">
                  Pagina {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSubscriptions(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
