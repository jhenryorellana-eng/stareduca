'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [studentCode, setStudentCode] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // 1. Intentar login con credenciales de Starbooks
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error('Credenciales incorrectas. Asegúrate de usar tu cuenta de Starbooks.')
      }

      if (!authData.user) {
        throw new Error('Error al verificar tu cuenta')
      }

      // 2. Verificar suscripción activa
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, subscription_status')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('No se encontró tu perfil de Starbooks')
      }

      if (profile.subscription_status !== 'active') {
        await supabase.auth.signOut()
        throw new Error('Necesitas tener una suscripción premium activa en Starbooks para registrarte como afiliado')
      }

      // 3. Verificar si ya es afiliado
      const { data: existingAffiliate } = await supabase
        .from('affiliates')
        .select('id, student_code')
        .eq('user_id', authData.user.id)
        .single()

      if (existingAffiliate) {
        // Ya es afiliado, redirigir al dashboard
        router.push('/dashboard')
        router.refresh()
        return
      }

      // 4. Obtener la app de Starbooks
      const { data: app, error: appError } = await supabase
        .from('apps')
        .select('id')
        .eq('slug', 'starbooks')
        .single()

      if (appError || !app) {
        throw new Error('Error de configuración: App no encontrada')
      }

      // 5. Crear registro de afiliado
      const { data: newAffiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          user_id: authData.user.id,
          app_id: app.id,
          is_active: true,
        })
        .select('student_code, referral_code')
        .single()

      if (affiliateError) {
        console.error('Affiliate error:', affiliateError)
        throw new Error('Error al crear tu cuenta de afiliado')
      }

      // 6. Enviar email de bienvenida (no bloqueante)
      fetch('/api/email/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          username: profile.username || email.split('@')[0],
          studentCode: newAffiliate.student_code,
          referralCode: newAffiliate.referral_code,
          appName: 'Starbooks',
        }),
      }).catch((err) => {
        console.error('Error sending welcome email:', err)
      })

      // 7. Mostrar éxito con código de estudiante
      setStudentCode(newAffiliate.student_code)
      setSuccess(true)

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 3000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (success && studentCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">¡Registro Exitoso!</CardTitle>
            <CardDescription className="text-slate-400">
              Tu cuenta de afiliado ha sido creada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
              <p className="text-sm text-slate-400 mb-2">Tu código de estudiante:</p>
              <p className="text-2xl font-mono font-bold text-indigo-400">{studentCode}</p>
            </div>
            <p className="text-sm text-slate-400">
              Guarda este código. Te hemos enviado un email con los detalles.
            </p>
            <p className="text-xs text-slate-500">
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <CardTitle className="text-2xl text-white">Registro de Afiliado</CardTitle>
          <CardDescription className="text-slate-400">
            Ingresa tu cuenta de Starbooks para registrarte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
              <strong>Nota:</strong> Debes tener una cuenta de Starbooks con suscripción premium activa.
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email de Starbooks</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contraseña de Starbooks</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
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
                  Verificando cuenta...
                </>
              ) : (
                'Registrarme como Afiliado'
              )}
            </Button>
            <p className="text-sm text-slate-400 text-center">
              ¿Ya eres afiliado?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
