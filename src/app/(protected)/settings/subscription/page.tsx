'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRICES, SUBSCRIPTION_STATUS, formatCurrency, formatDate } from '@/lib/constants'

interface Subscription {
  status: string
  type: 'monthly' | 'yearly'
  startDate: string | null
  endDate: string | null
  daysRemaining: number | null
  stripeCustomerId: string | null
  cancelAtPeriodEnd: boolean
}

interface Payment {
  id: string
  amount_cents: number
  currency: string
  status: string
  payment_method: string
  created_at: string
}

function SubscriptionPageContent() {
  const searchParams = useSearchParams()
  const upgradeStatus = searchParams.get('upgrade')
  const reactivateStatus = searchParams.get('reactivate')

  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  // Mostrar mensaje basado en query param
  useEffect(() => {
    if (upgradeStatus === 'success') {
      setMessage({ type: 'success', text: 'Tu plan ha sido actualizado a Anual. Gracias por tu confianza!' })
    } else if (upgradeStatus === 'cancelled') {
      setMessage({ type: 'error', text: 'El proceso de upgrade fue cancelado' })
    } else if (reactivateStatus === 'success') {
      setMessage({ type: 'success', text: 'Tu suscripcion ha sido reactivada. Bienvenido de vuelta!' })
    } else if (reactivateStatus === 'cancelled') {
      setMessage({ type: 'error', text: 'El proceso de reactivacion fue cancelado' })
    }
  }, [upgradeStatus, reactivateStatus])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      const data = await response.json()

      if (data.success) {
        setSubscription(data.subscription)
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
        // Redirigir a Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al iniciar el upgrade' })
        setUpgrading(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del servidor' })
      setUpgrading(false)
    }
  }

  const handleCancel = async () => {
    setCanceling(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Tu suscripcion se cancelara al final del periodo' })
        setShowCancelConfirm(false)
        // Refrescar datos
        fetchSubscription()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al cancelar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del servidor' })
    } finally {
      setCanceling(false)
    }
  }

  const handleReactivate = async () => {
    setReactivating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        if (data.type === 'checkout' && data.checkoutUrl) {
          // Redirigir a Stripe Checkout para nuevo pago
          window.location.href = data.checkoutUrl
        } else {
          // Reactivacion sin pago (cancelacion pendiente revertida)
          setMessage({ type: 'success', text: data.message || 'Tu suscripcion ha sido reactivada' })
          fetchSubscription()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al reactivar' })
        setReactivating(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del servidor' })
      setReactivating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400">No se pudo cargar la informacion de suscripcion</p>
      </div>
    )
  }

  const statusConfig = SUBSCRIPTION_STATUS[subscription.status as keyof typeof SUBSCRIPTION_STATUS] || SUBSCRIPTION_STATUS.inactive
  const isMonthly = subscription.type === 'monthly'
  const monthlyPriceUSD = PRICES.USD.monthly / 100
  const yearlyPriceUSD = PRICES.USD.yearly / 100
  const yearlyEquivalent = monthlyPriceUSD * 12
  const savings = yearlyEquivalent - yearlyPriceUSD
  const savingsPercent = Math.round((savings / yearlyEquivalent) * 100)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Mi Suscripcion</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={cn(
          "flex items-center gap-2 p-4 rounded-lg",
          message.type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Subscription */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Tu Suscripcion</h2>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Estado</span>
            <Badge className={cn(statusConfig.bgColor, statusConfig.textColor)}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Plan */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Plan</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {subscription.type === 'yearly' ? 'Anual' : 'Mensual'}
              </span>
              {subscription.type === 'yearly' && (
                <Badge className="bg-amber-500/20 text-amber-400">
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Precio</span>
            <span className="text-white">
              {subscription.type === 'yearly'
                ? `$${yearlyPriceUSD.toFixed(2)}/año`
                : `$${monthlyPriceUSD.toFixed(2)}/mes`
              }
            </span>
          </div>

          {/* Start Date */}
          {subscription.startDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Miembro desde</span>
              <span className="text-white">{formatDate(subscription.startDate)}</span>
            </div>
          )}

          {/* Next Renewal */}
          {subscription.endDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Proxima renovacion</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{formatDate(subscription.endDate)}</span>
                {subscription.daysRemaining !== null && subscription.daysRemaining > 0 && (
                  <span className="text-slate-500">({subscription.daysRemaining} dias)</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Section - Only for monthly */}
      {isMonthly && subscription.status === 'active' && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Mejora a Plan Anual</h2>
              <p className="text-sm text-slate-400">Ahorra mas con el plan anual</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {/* Current cost */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">Actualmente pagas</span>
              <span className="text-white">${yearlyEquivalent.toFixed(2)}/año</span>
            </div>

            {/* Yearly cost */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">Con plan anual</span>
              <span className="text-green-400 font-semibold">${yearlyPriceUSD.toFixed(2)}/año</span>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/50" />

            {/* Savings */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-green-400 font-medium">Tu ahorro</span>
              </div>
              <span className="text-green-400 font-bold">
                ${savings.toFixed(2)}/año ({savingsPercent}%)
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2 mb-6">
            <p className="text-sm text-slate-400 mb-2">Beneficios del plan anual:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Ahorro del {savingsPercent}%
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Sin interrupciones
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Acceso completo
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Soporte prioritario
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-semibold py-6"
          >
            {upgrading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Star className="h-5 w-5 mr-2" />
                Mejorar a Plan Anual - ${yearlyPriceUSD.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Already Yearly */}
      {subscription.type === 'yearly' && subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Ya tienes el mejor plan!</h3>
              <p className="text-sm text-slate-400">
                Disfrutas de todos los beneficios del plan anual con un ahorro del {savingsPercent}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Pending Warning */}
      {subscription.status === 'active' && subscription.cancelAtPeriodEnd && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Cancelacion Programada</h3>
              <p className="text-sm text-slate-400">
                Tu suscripcion no se renovara. Tienes acceso hasta el {subscription.endDate ? formatDate(subscription.endDate) : 'fin del periodo'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 mb-4">
            <p className="text-sm text-slate-300">
              Despues de esta fecha perderas acceso a todos los cursos y contenido. Si cambias de opinion, puedes reactivar tu suscripcion sin costo adicional.
            </p>
          </div>

          <Button
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
          >
            {reactivating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Reactivar Suscripcion
              </>
            )}
          </Button>
        </div>
      )}

      {/* Inactive/Expired Subscription */}
      {(subscription.status === 'inactive' || subscription.status === 'canceled' || subscription.status === 'expired') && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-slate-600/20 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Suscripcion Inactiva</h3>
              <p className="text-sm text-slate-400">
                {subscription.endDate
                  ? `Tu suscripcion expiro el ${formatDate(subscription.endDate)}`
                  : 'Tu suscripcion no esta activa'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 mb-4">
            <p className="text-sm text-slate-300">
              Reactiva tu suscripcion para recuperar acceso a todos los cursos y contenido exclusivo.
            </p>
          </div>

          <Button
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
          >
            {reactivating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Reactivar Suscripcion - ${subscription.type === 'yearly' ? yearlyPriceUSD.toFixed(2) : monthlyPriceUSD.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Cancel Subscription Section */}
      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
        <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-400">Cancelar suscripcion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tu acceso continuara hasta el final del periodo pagado
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 mb-4">
                ¿Estas seguro que deseas cancelar? Tu acceso continuara hasta el {subscription.endDate ? formatDate(subscription.endDate) : 'fin del periodo actual'}, despues de eso perderas acceso a todo el contenido.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-white"
                >
                  No, mantener suscripcion
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {canceling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cancelando...
                    </>
                  ) : (
                    'Si, cancelar suscripcion'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Historial de Pagos</h2>
          </div>

          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-300">
                    {formatDate(payment.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(payment.amount_cents, payment.currency)}
                  </span>
                  <Badge className={cn(
                    payment.status === 'succeeded'
                      ? "bg-green-500/20 text-green-400"
                      : "bg-slate-500/20 text-slate-400"
                  )}>
                    {payment.status === 'succeeded' ? 'Pagado' : payment.status}
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

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  )
}
