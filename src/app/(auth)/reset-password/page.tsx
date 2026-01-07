'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Validar que hay token
  useEffect(() => {
    if (!token) {
      setError('Enlace invalido. Solicita uno nuevo desde la pagina de recuperacion.')
    }
  }, [token])

  const isValidPassword = (pwd: string) => {
    return pwd.length >= 8 && /^[a-zA-Z0-9]+$/.test(pwd)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }

    if (!isValidPassword(password)) {
      setError('La contrasena debe tener minimo 8 caracteres y solo letras y numeros')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer la contrasena')
      }

      setSuccess(true)

      // Redirigir a login despues de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">Contrasena Actualizada</CardTitle>
            <CardDescription className="text-slate-400">
              Tu contrasena ha sido restablecida correctamente. Ya puedes iniciar sesion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <p className="text-sm text-slate-300 text-center">
                Redirigiendo a iniciar sesion...
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Ir a Iniciar Sesion
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-white">Enlace Invalido</CardTitle>
            <CardDescription className="text-slate-400">
              Este enlace no es valido o ha expirado. Solicita uno nuevo.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Solicitar Nuevo Enlace
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-700">
                Volver a Iniciar Sesion
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Nueva Contrasena</CardTitle>
          <CardDescription className="text-slate-400">
            Ingresa tu nueva contrasena para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Nueva Contrasena
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimo 8 caracteres"
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
              <p className="text-xs text-slate-500">
                Minimo 8 caracteres, solo letras y numeros
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Confirmar Contrasena
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite la contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <div className={`h-1 flex-1 rounded ${/[a-zA-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 12 ? 'bg-green-500' : 'bg-slate-600'}`} />
                </div>
                <p className="text-xs text-slate-500">
                  {password.length < 8 ? 'Contrasena muy corta' :
                   !isValidPassword(password) ? 'Solo letras y numeros' :
                   'Contrasena valida'}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading || !isValidPassword(password) || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Restablecer Contrasena'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
