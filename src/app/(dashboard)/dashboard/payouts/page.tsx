'use client'

import { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, PAYOUT_STATUS, MIN_PAYOUT_AMOUNT } from '@/lib/constants'

interface Payout {
  id: string
  amount_cents: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payment_method: string
  created_at: string
  processed_at?: string
}

export default function PayoutsPage() {
  const [affiliate, setAffiliate] = useState<{
    id: string
    pending_balance_cents: number
    paid_balance_cents: number
    paypal_email?: string
  } | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('id, pending_balance_cents, paid_balance_cents, paypal_email')
        .eq('user_id', user.id)
        .single()

      setAffiliate(affiliateData)

      if (affiliateData) {
        const { data: payoutsData } = await supabase
          .from('affiliate_payouts')
          .select('*')
          .eq('affiliate_id', affiliateData.id)
          .order('created_at', { ascending: false })

        setPayouts(payoutsData || [])
      }
    }
    setLoading(false)
  }

  const requestPayout = async () => {
    if (!affiliate) return

    setRequesting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!affiliate.paypal_email) {
        throw new Error('Debes configurar tu email de PayPal en Configuración antes de solicitar un pago')
      }

      if (affiliate.pending_balance_cents < MIN_PAYOUT_AMOUNT * 100) {
        throw new Error(`El mínimo para retiro es ${formatCurrency(MIN_PAYOUT_AMOUNT)}`)
      }

      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_id: affiliate.id,
          amount_cents: affiliate.pending_balance_cents,
          payment_method: 'paypal',
          payment_details: { email: affiliate.paypal_email },
          status: 'pending',
        })

      if (insertError) throw insertError

      setSuccess('Solicitud de pago enviada. Procesaremos tu pago en las próximas 24-48 horas.')
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar el pago')
    } finally {
      setRequesting(false)
    }
  }

  const getStatusStyle = (status: string) => {
    const config = PAYOUT_STATUS[status as keyof typeof PAYOUT_STATUS]
    return config ? `${config.bgColor} ${config.textColor}` : 'bg-slate-600 text-slate-300'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  const pendingBalance = (affiliate?.pending_balance_cents || 0) / 100
  const canRequestPayout = pendingBalance >= MIN_PAYOUT_AMOUNT && affiliate?.paypal_email

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pagos</h1>
        <p className="text-slate-400">
          Solicita retiros de tus ganancias y revisa el historial de pagos.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
          {success}
        </div>
      )}

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Balance Disponible para Retiro</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(pendingBalance)}</p>
              <p className="text-sm text-slate-400 mt-1">
                Mínimo para retiro: {formatCurrency(MIN_PAYOUT_AMOUNT)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={requestPayout}
                disabled={!canRequestPayout || requesting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {requesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Solicitar Pago
                  </>
                )}
              </Button>
              {!affiliate?.paypal_email && (
                <p className="text-xs text-amber-400">
                  Configura tu PayPal primero
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600/20">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Pagado</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency((affiliate?.paid_balance_cents || 0) / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-600/20">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Método de Pago</p>
                <p className="text-2xl font-bold text-white">
                  {affiliate?.paypal_email ? 'PayPal' : 'No configurado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts History */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg text-slate-400">Aún no tienes pagos</p>
              <p className="text-sm text-slate-500 mt-2">
                Solicita tu primer pago cuando alcances el mínimo de {formatCurrency(MIN_PAYOUT_AMOUNT)}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Monto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Método</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Procesado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-slate-700/50">
                      <td className="py-4 px-4 text-sm text-slate-300">
                        {formatDate(payout.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-green-400">
                          {formatCurrency(payout.amount_cents / 100)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-300 capitalize">
                        {payout.payment_method}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {payout.processed_at ? formatDate(payout.processed_at) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(payout.status)}`}>
                            {PAYOUT_STATUS[payout.status as keyof typeof PAYOUT_STATUS]?.label || payout.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Información sobre Pagos</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              Los pagos se procesan mediante PayPal en un plazo de 24-48 horas hábiles.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              El monto mínimo para solicitar un retiro es de {formatCurrency(MIN_PAYOUT_AMOUNT)}.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              Asegúrate de que tu email de PayPal esté correctamente configurado.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              Las comisiones se aprueban automáticamente después de confirmar el pago del referido.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
