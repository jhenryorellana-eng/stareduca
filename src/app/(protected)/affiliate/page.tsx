'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  DollarSign,
  Users,
  MousePointerClick,
  TrendingUp,
  Copy,
  CheckCircle,
  ExternalLink,
  Clock,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Affiliate {
  id: string
  referral_code: string
  paypal_email: string | null
  is_active: boolean
  total_earnings: number
  pending_balance: number
  paid_balance: number
  referral_count: number
  active_referrals_count: number
  link_clicks: number
  conversion_rate: number
}

interface Commission {
  id: string
  subscription_amount: number
  commission_amount: number
  commission_rate: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  created_at: string
  referred_student: {
    id: string
    full_name: string
    student_code: string
  }
}

interface Payout {
  id: string
  amount: number
  payment_method: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  processed_at: string | null
}

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  processing: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400'
}

const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido'
}

export default function AffiliatePage() {
  const [loading, setLoading] = useState(true)
  const [isAffiliate, setIsAffiliate] = useState(false)
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [copied, setCopied] = useState(false)
  const [activating, setActivating] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [savingPaypal, setSavingPaypal] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/affiliate')
      const data = await response.json()

      if (data.success) {
        setIsAffiliate(data.isAffiliate)
        if (data.isAffiliate) {
          setAffiliate(data.affiliate)
          setCommissions(data.recentCommissions || [])
          setPayouts(data.recentPayouts || [])
          setPaypalEmail(data.affiliate.paypal_email || '')
        }
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleActivate = async () => {
    setActivating(true)
    try {
      const response = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()
      if (data.success) {
        setIsAffiliate(true)
        setAffiliate(data.affiliate)
      }
    } catch (error) {
      console.error('Error activating affiliate:', error)
    } finally {
      setActivating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!affiliate) return
    const link = `${window.location.origin}/register?ref=${affiliate.referral_code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSavePaypal = async () => {
    if (!paypalEmail.trim()) return
    setSavingPaypal(true)

    try {
      const response = await fetch('/api/affiliate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypal_email: paypalEmail.trim() })
      })

      const data = await response.json()
      if (data.success && affiliate) {
        setAffiliate({ ...affiliate, paypal_email: paypalEmail.trim() })
      }
    } catch (error) {
      console.error('Error saving paypal:', error)
    } finally {
      setSavingPaypal(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!affiliate || affiliate.pending_balance < 20) return
    setRequestingPayout(true)

    try {
      const response = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: 'paypal' })
      })

      const data = await response.json()
      if (data.success) {
        await fetchData()
      } else {
        alert(data.error || 'Error al solicitar pago')
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
    } finally {
      setRequestingPayout(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  // No es afiliado: mostrar CTA
  if (!isAffiliate) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30">
          <DollarSign className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">
            Programa de Afiliados
          </h1>
          <p className="text-slate-300 mb-6 max-w-md mx-auto">
            Gana <span className="text-green-400 font-bold">80% de comision</span> por cada
            estudiante que se registre usando tu enlace de referido.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-green-400">80%</p>
              <p className="text-sm text-slate-400">Comision</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-white">$5.60</p>
              <p className="text-sm text-slate-400">Por mensual</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-white">$56</p>
              <p className="text-sm text-slate-400">Por anual</p>
            </div>
          </div>

          <Button
            onClick={handleActivate}
            disabled={activating}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {activating ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <TrendingUp className="h-5 w-5 mr-2" />
            )}
            Activar programa de afiliados
          </Button>
        </div>
      </div>
    )
  }

  if (!affiliate) return null

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${affiliate.referral_code}`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Programa de Afiliados</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${affiliate.total_earnings.toFixed(2)}</p>
              <p className="text-sm text-slate-400">Ganancias totales</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${affiliate.pending_balance.toFixed(2)}</p>
              <p className="text-sm text-slate-400">Balance pendiente</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{affiliate.referral_count}</p>
              <p className="text-sm text-slate-400">Referidos totales</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <MousePointerClick className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{affiliate.link_clicks}</p>
              <p className="text-sm text-slate-400">Clicks en enlace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral link */}
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Tu enlace de referido</h3>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-700/50">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-transparent text-sm text-slate-300 outline-none truncate"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
            <span>Codigo: <span className="text-indigo-400">{affiliate.referral_code}</span></span>
            <span>·</span>
            <span>Tasa conversion: <span className="text-green-400">{affiliate.conversion_rate}%</span></span>
          </div>
        </div>

        {/* PayPal config */}
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Metodo de pago</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Email de PayPal</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <Button
                  onClick={handleSavePaypal}
                  disabled={savingPaypal || paypalEmail === affiliate.paypal_email}
                  size="sm"
                >
                  {savingPaypal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
            </div>

            {affiliate.pending_balance >= 20 && affiliate.paypal_email && (
              <Button
                onClick={handleRequestPayout}
                disabled={requestingPayout}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {requestingPayout ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Solicitar pago (${affiliate.pending_balance.toFixed(2)})
              </Button>
            )}

            {affiliate.pending_balance > 0 && affiliate.pending_balance < 20 && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Minimo $20 para solicitar pago</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent commissions */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Comisiones recientes</h3>

        {commissions.length === 0 ? (
          <p className="text-center py-8 text-slate-400">
            Aun no tienes comisiones. Comparte tu enlace para empezar a ganar.
          </p>
        ) : (
          <div className="space-y-3">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {commission.referred_student.full_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(commission.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">
                    +${commission.commission_amount.toFixed(2)}
                  </p>
                  <Badge className={cn("text-xs", statusColors[commission.status])}>
                    {statusLabels[commission.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent payouts */}
      {payouts.length > 0 && (
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Historial de pagos</h3>

          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    Pago via {payout.payment_method}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(payout.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    ${payout.amount.toFixed(2)}
                  </p>
                  <Badge className={cn("text-xs", statusColors[payout.status])}>
                    {statusLabels[payout.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
