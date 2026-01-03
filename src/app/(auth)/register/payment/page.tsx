'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Smartphone, Shield, CreditCard } from 'lucide-react'
import { PRICES } from '@/lib/constants'

declare global {
  interface Window {
    Culqi: {
      publicKey: string
      settings: (options: object) => void
      options: (options: object) => void
      open: () => void
      close: () => void
      token: { id: string } | null
    }
    culqi: () => void
  }
}

type PaymentMethodType = 'yape' | 'plin' | 'card_culqi'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingRegistrationId = searchParams.get('id')
  const plan = searchParams.get('plan') as 'monthly' | 'yearly' | null
  const method = (searchParams.get('method') || 'yape') as PaymentMethodType

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [culqiLoaded, setCulqiLoaded] = useState(false)

  const amount = plan === 'yearly' ? PRICES.PEN.yearly : PRICES.PEN.monthly
  const formattedAmount = `S/${(amount / 100).toFixed(2)}`

  // Configuracion visual segun metodo de pago
  const paymentMethodConfig = {
    yape: {
      title: 'Pagar con Yape',
      icon: Smartphone,
      color: '#6B21A8', // Purple
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/20',
      textColor: 'text-purple-400',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
      instructions: [
        'Haz clic en "Pagar con Yape"',
        'Ingresa tu numero de celular registrado en Yape',
        'Aprueba el pago desde tu app Yape',
        'Espera la confirmacion',
      ],
    },
    plin: {
      title: 'Pagar con Plin',
      icon: Smartphone,
      color: '#059669', // Green
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-400',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      instructions: [
        'Haz clic en "Pagar con Plin"',
        'Ingresa tu numero de celular registrado en Plin',
        'Aprueba el pago desde tu app bancaria',
        'Espera la confirmacion',
      ],
    },
    card_culqi: {
      title: 'Pagar con Tarjeta',
      icon: CreditCard,
      color: '#6366F1', // Indigo
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-500/20',
      textColor: 'text-indigo-400',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      instructions: [
        'Haz clic en "Pagar con Tarjeta"',
        'Ingresa los datos de tu tarjeta',
        'Confirma el pago',
        'Espera la confirmacion',
      ],
    },
  }

  const config = paymentMethodConfig[method] || paymentMethodConfig.yape

  // Funcion para procesar el token
  const processToken = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/culqi/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          pendingRegistrationId,
          paymentMethod: method,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar el pago')
      }

      // Pago exitoso, ir a completar registro
      router.push(`/register/complete?id=${pendingRegistrationId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
      setLoading(false)
    }
  }, [pendingRegistrationId, router, method])

  // Configurar Culqi cuando el script carga
  useEffect(() => {
    if (!culqiLoaded || !pendingRegistrationId) return

    const publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY
    if (!publicKey) {
      setError('Configuracion de pago no disponible')
      return
    }

    window.Culqi.publicKey = publicKey

    window.Culqi.settings({
      title: 'StarEduca',
      currency: 'PEN',
      amount: amount,
      order: pendingRegistrationId,
    })

    window.Culqi.options({
      lang: 'es',
      style: {
        logo: 'https://stareduca.ai/logo.png',
        bannerColor: config.color,
        buttonBackground: config.color,
        menuColor: config.color,
        linksColor: config.color,
        priceColor: config.color,
      },
    })

    // Callback cuando se genera el token
    window.culqi = () => {
      if (window.Culqi.token) {
        processToken(window.Culqi.token.id)
      } else {
        setError('No se pudo generar el token de pago')
      }
    }
  }, [culqiLoaded, pendingRegistrationId, amount, processToken, config.color])

  const handleOpenCulqi = () => {
    if (window.Culqi) {
      window.Culqi.open()
    }
  }

  if (!pendingRegistrationId || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-red-400 text-center">
              Enlace de pago invalido. Por favor, inicia el registro nuevamente.
            </p>
            <Button
              onClick={() => router.push('/register')}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
            >
              Volver al registro
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const IconComponent = config.icon

  return (
    <>
      <Script
        src="https://checkout.culqi.com/js/v4"
        onLoad={() => setCulqiLoaded(true)}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center relative">
            <button
              onClick={() => router.push('/register')}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <IconComponent className={`h-8 w-8 ${config.textColor}`} />
            </div>
            <CardTitle className="text-2xl text-white">{config.title}</CardTitle>
            <CardDescription className="text-slate-400">
              Completa tu pago para activar tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Resumen del pago */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Plan</span>
                <span className="text-white font-medium">
                  {plan === 'monthly' ? 'Mensual' : 'Anual'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total a pagar</span>
                <span className="text-2xl font-bold text-white">{formattedAmount}</span>
              </div>
            </div>

            {/* Boton de pago */}
            <Button
              onClick={handleOpenCulqi}
              disabled={loading || !culqiLoaded}
              className={`w-full py-6 text-lg ${config.buttonBg}`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Procesando pago...
                </>
              ) : !culqiLoaded ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <IconComponent className="mr-2 h-5 w-5" />
                  {config.title}
                </>
              )}
            </Button>

            {/* Seguridad */}
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Shield className="h-4 w-4" />
              <span>Pago seguro procesado por Culqi</span>
            </div>

            {/* Instrucciones */}
            <div className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
              <h4 className={`${config.textColor} font-medium mb-2`}>Como pagar:</h4>
              <ol className={`text-sm ${config.textColor} opacity-80 space-y-1 list-decimal list-inside`}>
                {config.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentContent />
    </Suspense>
  )
}
