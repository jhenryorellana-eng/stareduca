'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('') // email o codigo de estudiante
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      let loginEmail = identifier

      // Si parece un codigo de estudiante (XXX-YYYYYY), convertir a email
      if (/^[A-Za-z]{3}-\d{6}$/.test(identifier)) {
        // Formato: ABC-123456 -> abc123456@starbizacademy.com
        const code = identifier.toLowerCase().replace('-', '')
        loginEmail = `${code}@starbizacademy.com`
      }
      // Si es solo el codigo sin guion (abc123456), agregar dominio
      else if (/^[A-Za-z]{3}\d{6}$/.test(identifier)) {
        loginEmail = `${identifier.toLowerCase()}@starbizacademy.com`
      }

      // Intentar login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales incorrectas. Verifica tu codigo/email y contrasena.')
        }
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Error al iniciar sesion')
      }

      // Redirigir al dashboard
      router.push('/dashboard')
      router.refresh()

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <CardTitle className="text-2xl text-white">Iniciar Sesion</CardTitle>
          <CardDescription className="text-slate-400">
            Accede a tu cuenta de StarEduca
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
              <Label htmlFor="identifier" className="text-slate-300">
                Codigo de Estudiante o Email
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="ABC-123456 o tu@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Puedes usar tu codigo (ej: ABC-123456) o tu email generado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contrasena"
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

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesion...
                </>
              ) : (
                'Iniciar Sesion'
              )}
            </Button>

            <p className="text-sm text-slate-400 text-center">
              No tienes cuenta?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
                Registrate aqui
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
