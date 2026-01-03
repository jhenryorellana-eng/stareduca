'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowRight, Check, CreditCard } from 'lucide-react'
import { PRICES } from '@/lib/constants'

type Plan = 'monthly' | 'yearly'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const referralCode = searchParams.get('ref')

  // Estado del formulario
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<Plan>('monthly')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Calcular precio en USD
  const getPrice = (planType: Plan) => {
    const priceCents = planType === 'monthly' ? PRICES.USD.monthly : PRICES.USD.yearly
    return `$${(priceCents / 100).toFixed(2)}`
  }

  // Calcular precio mensual equivalente para plan anual
  const getMonthlyEquivalent = () => {
    const monthlyEquivalent = PRICES.USD.yearly / 100 / 12
    return `$${monthlyEquivalent.toFixed(2)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          plan,
          paymentProvider: 'stripe',
          paymentMethod: 'card_stripe',
          country: 'US',
          referralCode,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al iniciar el registro')
      }

      // Redirigir al checkout de Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      throw new Error('Respuesta inesperada del servidor')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <CardTitle className="text-2xl text-white">Crear Cuenta en StarEduca</CardTitle>
          <CardDescription className="text-slate-400">
            Accede a todos los cursos, videos y la comunidad de emprendedores
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {canceled && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                El pago fue cancelado. Puedes intentarlo nuevamente.
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Datos personales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Datos Personales</h3>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  Te enviaremos un email de bienvenida con tu codigo de estudiante
                </p>
              </div>
            </div>

            {/* Seleccion de plan */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Selecciona tu Plan</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Mensual */}
                <button
                  type="button"
                  onClick={() => setPlan('monthly')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    plan === 'monthly'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-600 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Plan Mensual</span>
                    {plan === 'monthly' && (
                      <Check className="h-5 w-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {getPrice('monthly')}
                    <span className="text-sm font-normal text-slate-400">/mes</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Facturación mensual</p>
                </button>

                {/* Plan Anual */}
                <button
                  type="button"
                  onClick={() => setPlan('yearly')}
                  className={`p-4 rounded-lg border-2 text-left transition-all relative ${
                    plan === 'yearly'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-600 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <div className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                    Ahorra 25%
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Plan Anual</span>
                    {plan === 'yearly' && (
                      <Check className="h-5 w-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {getPrice('yearly')}
                    <span className="text-sm font-normal text-slate-400">/año</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Equivale a {getMonthlyEquivalent()}/mes
                  </p>
                </button>
              </div>
            </div>

            {/* Metodo de pago */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <CreditCard className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Pago con Tarjeta</h4>
                  <p className="text-sm text-slate-400">Visa, Mastercard, American Express</p>
                </div>
              </div>
            </div>

            {/* Que incluye */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
              <h4 className="text-white font-medium mb-3">Tu suscripción incluye:</h4>
              <ul className="space-y-2">
                {[
                  'Acceso a todos los cursos y materiales',
                  'Videos exclusivos y contenido descargable',
                  'Comunidad privada de emprendedores',
                  'Soporte personalizado',
                  'Certificados de finalización',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading || !fullName || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Continuar al Pago
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-sm text-slate-400 text-center">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                Inicia sesión
              </Link>
            </p>

            <p className="text-xs text-slate-500 text-center">
              Al continuar, aceptas nuestros{' '}
              <Link href="/terms" className="text-indigo-400 hover:underline">
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link href="/privacy" className="text-indigo-400 hover:underline">
                Política de Privacidad
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegisterContent />
    </Suspense>
  )
}
