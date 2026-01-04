'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowRight, ArrowLeft, Check, CreditCard, User, Users } from 'lucide-react'
import { PRICES } from '@/lib/constants'

type Plan = 'monthly' | 'yearly'
type Step = 1 | 2 | 3

function RegisterContent() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const referralCode = searchParams.get('ref')

  // Estado del paso actual
  const [step, setStep] = useState<Step>(1)

  // Estado del formulario - Datos del Hijo
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [childCity, setChildCity] = useState('')
  const [childCountry, setChildCountry] = useState('')

  // Estado del formulario - Datos del Padre
  const [parentFirstName, setParentFirstName] = useState('')
  const [parentLastName, setParentLastName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentWhatsapp, setParentWhatsapp] = useState('')

  // Estado del formulario - Plan
  const [plan, setPlan] = useState<Plan>('monthly')

  // Estado general
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

  // Validar paso 1 (datos del hijo)
  const validateStep1 = () => {
    if (!childFirstName.trim()) {
      setError('Los nombres del estudiante son requeridos')
      return false
    }
    if (!childLastName.trim()) {
      setError('Los apellidos del estudiante son requeridos')
      return false
    }
    if (!childAge || parseInt(childAge) < 5 || parseInt(childAge) > 99) {
      setError('La edad debe estar entre 5 y 99 años')
      return false
    }
    if (!childCity.trim()) {
      setError('La ciudad es requerida')
      return false
    }
    if (!childCountry.trim()) {
      setError('El país es requerido')
      return false
    }
    return true
  }

  // Validar paso 2 (datos del padre)
  const validateStep2 = () => {
    if (!parentFirstName.trim()) {
      setError('Los nombres del padre/tutor son requeridos')
      return false
    }
    if (!parentLastName.trim()) {
      setError('Los apellidos del padre/tutor son requeridos')
      return false
    }
    if (!parentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      setError('El correo electrónico no es válido')
      return false
    }
    if (!parentWhatsapp.trim() || parentWhatsapp.length < 8) {
      setError('El número de WhatsApp debe tener al menos 8 dígitos')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    setError(null)
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setError(null)
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
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
          // Datos del hijo (el estudiante)
          childFirstName,
          childLastName,
          childAge: parseInt(childAge),
          childCity,
          childCountry,
          // Datos del padre
          parentFirstName,
          parentLastName,
          parentEmail,
          parentWhatsapp,
          // Datos de suscripción
          fullName: `${childFirstName} ${childLastName}`,
          email: parentEmail,
          plan,
          paymentProvider: 'stripe',
          paymentMethod: 'card_stripe',
          country: childCountry,
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

  // Indicador de pasos
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              s === step
                ? 'bg-indigo-600 text-white'
                : s < step
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {s < step ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-1 mx-1 ${
                s < step ? 'bg-green-500' : 'bg-slate-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <CardTitle className="text-2xl text-white">Crear Cuenta en StarEduca</CardTitle>
          <CardDescription className="text-slate-400">
            {step === 1 && 'Paso 1: Datos del estudiante'}
            {step === 2 && 'Paso 2: Datos del padre o tutor'}
            {step === 3 && 'Paso 3: Selecciona tu plan de suscripción'}
          </CardDescription>
          <StepIndicator />
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

            {/* PASO 1: Datos del Hijo/Estudiante */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-medium text-white">Datos del Estudiante</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childFirstName" className="text-slate-300">Nombres</Label>
                    <Input
                      id="childFirstName"
                      type="text"
                      placeholder="Nombres del estudiante"
                      value={childFirstName}
                      onChange={(e) => setChildFirstName(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="childLastName" className="text-slate-300">Apellidos</Label>
                    <Input
                      id="childLastName"
                      type="text"
                      placeholder="Apellidos del estudiante"
                      value={childLastName}
                      onChange={(e) => setChildLastName(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childAge" className="text-slate-300">Edad</Label>
                  <Input
                    id="childAge"
                    type="number"
                    min="5"
                    max="99"
                    placeholder="Edad del estudiante"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childCity" className="text-slate-300">Ciudad</Label>
                    <Input
                      id="childCity"
                      type="text"
                      placeholder="Ciudad donde vive"
                      value={childCity}
                      onChange={(e) => setChildCity(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="childCountry" className="text-slate-300">País</Label>
                    <Input
                      id="childCountry"
                      type="text"
                      placeholder="País donde vive"
                      value={childCountry}
                      onChange={(e) => setChildCountry(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: Datos del Padre/Tutor */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-medium text-white">Datos del Padre o Tutor</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentFirstName" className="text-slate-300">Nombres</Label>
                    <Input
                      id="parentFirstName"
                      type="text"
                      placeholder="Nombres del padre/tutor"
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentLastName" className="text-slate-300">Apellidos</Label>
                    <Input
                      id="parentLastName"
                      type="text"
                      placeholder="Apellidos del padre/tutor"
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail" className="text-slate-300">Correo Electrónico</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    Aquí recibirás el código de estudiante y las notificaciones
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentWhatsapp" className="text-slate-300">Número de WhatsApp</Label>
                  <Input
                    id="parentWhatsapp"
                    type="tel"
                    placeholder="+51 999 999 999"
                    value={parentWhatsapp}
                    onChange={(e) => setParentWhatsapp(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    Incluye el código de país (ej: +51 para Perú)
                  </p>
                </div>
              </div>
            )}

            {/* PASO 3: Selección de Plan y Pago */}
            {step === 3 && (
              <>
                {/* Resumen de datos */}
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 space-y-2">
                  <h4 className="text-white font-medium">Resumen del registro</h4>
                  <div className="text-sm text-slate-400">
                    <p><span className="text-slate-300">Estudiante:</span> {childFirstName} {childLastName}, {childAge} años</p>
                    <p><span className="text-slate-300">Ubicación:</span> {childCity}, {childCountry}</p>
                    <p><span className="text-slate-300">Padre/Tutor:</span> {parentFirstName} {parentLastName}</p>
                    <p><span className="text-slate-300">Contacto:</span> {parentEmail}</p>
                  </div>
                </div>

                {/* Selección de plan */}
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

                {/* Método de pago */}
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

                {/* Qué incluye */}
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
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="flex w-full gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className={`${step === 1 ? 'w-full' : 'flex-1'} bg-indigo-600 hover:bg-indigo-700`}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
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
              )}
            </div>

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
