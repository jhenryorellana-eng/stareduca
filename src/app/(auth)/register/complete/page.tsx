'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { isValidPassword } from '@/lib/constants'

function CompleteRegistrationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Para Stripe: session_id viene en la URL
  const sessionId = searchParams.get('session_id')
  // Para Culqi: id viene en la URL
  const pendingRegistrationId = searchParams.get('id')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [studentData, setStudentData] = useState<{
    studentCode: string
    generatedEmail: string
    fullName: string
  } | null>(null)

  // Validar que tenemos los parametros necesarios
  useEffect(() => {
    if (!sessionId && !pendingRegistrationId) {
      setError('Enlace invalido. Por favor, inicia el registro nuevamente.')
    }
  }, [sessionId, pendingRegistrationId])

  const passwordErrors = (() => {
    const errors: string[] = []
    if (password.length > 0 && password.length < 8) {
      errors.push('Minimo 8 caracteres')
    }
    if (password.length > 0 && !/^[a-zA-Z0-9]+$/.test(password)) {
      errors.push('Solo letras y numeros')
    }
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      errors.push('Las contrasenas no coinciden')
    }
    return errors
  })()

  const isFormValid = password.length >= 8 &&
    isValidPassword(password) &&
    password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          pendingRegistrationId,
          password,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al completar el registro')
      }

      // Guardar datos del estudiante
      setStudentData({
        studentCode: data.student.studentCode,
        generatedEmail: data.student.generatedEmail,
        fullName: data.student.fullName,
      })
      setSuccess(true)

      // Redirigir al dashboard despues de 5 segundos
      setTimeout(() => {
        router.push('/dashboard')
      }, 5000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de exito
  if (success && studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              ¡Bienvenido a StarEduca!
            </CardTitle>
            <CardDescription className="text-slate-400">
              Tu cuenta ha sido creada exitosamente
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-slate-300">
              Hola <strong className="text-white">{studentData.fullName}</strong>
            </p>

            {/* Codigo de estudiante */}
            <div className="p-4 rounded-lg bg-slate-900 border-2 border-indigo-500">
              <p className="text-sm text-slate-400 mb-1">Tu codigo de estudiante</p>
              <p className="text-3xl font-mono font-bold text-indigo-400 tracking-wider">
                {studentData.studentCode}
              </p>
            </div>

            {/* Email generado */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Tu email de acceso</p>
              <p className="text-lg font-mono text-green-400">
                {studentData.generatedEmail}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
              Te hemos enviado un email con tus credenciales. Guarda esta informacion.
            </div>

            <p className="text-xs text-slate-500">
              Redirigiendo al dashboard en 5 segundos...
            </p>

            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Ir al Dashboard ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl text-white">Crear Contrasena</CardTitle>
          <CardDescription className="text-slate-400">
            Ultimo paso: crea tu contrasena para acceder a la plataforma
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4 inline mr-2" />
              Pago verificado exitosamente
            </div>

            {/* Contrasena */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Contrasena
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimo 8 caracteres alfanumericos"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar contrasena */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Confirmar Contrasena
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite tu contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Errores de validacion */}
            {passwordErrors.length > 0 && (
              <ul className="text-sm text-red-400 space-y-1">
                {passwordErrors.map((err, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {err}
                  </li>
                ))}
              </ul>
            )}

            {/* Requisitos de contrasena */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Requisitos de contrasena:</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li className={password.length >= 8 ? 'text-green-400' : ''}>
                  {password.length >= 8 ? '✓' : '○'} Minimo 8 caracteres
                </li>
                <li className={/^[a-zA-Z0-9]+$/.test(password) && password.length > 0 ? 'text-green-400' : ''}>
                  {/^[a-zA-Z0-9]+$/.test(password) && password.length > 0 ? '✓' : '○'} Solo letras y numeros (alfanumerico)
                </li>
                <li className={password === confirmPassword && confirmPassword.length > 0 ? 'text-green-400' : ''}>
                  {password === confirmPassword && confirmPassword.length > 0 ? '✓' : '○'} Las contrasenas coinciden
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Completar Registro'
              )}
            </Button>
          </CardContent>
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

export default function CompleteRegistrationPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompleteRegistrationContent />
    </Suspense>
  )
}
