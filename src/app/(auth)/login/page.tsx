'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // 1. Intentar login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error('Credenciales incorrectas')
      }

      if (!authData.user) {
        throw new Error('Error al iniciar sesión')
      }

      // 2. Verificar si tiene perfil con suscripción activa
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, subscription_status')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('No se encontró tu perfil de Starbooks')
      }

      if (profile.subscription_status !== 'active') {
        await supabase.auth.signOut()
        throw new Error('Necesitas tener una suscripción activa en Starbooks para ser afiliado')
      }

      // 3. Verificar si ya es afiliado o crear registro
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (!affiliate) {
        // Crear nuevo afiliado
        const { data: app } = await supabase
          .from('apps')
          .select('id')
          .eq('slug', 'starbooks')
          .single()

        if (app) {
          await supabase
            .from('affiliates')
            .insert({
              user_id: authData.user.id,
              app_id: app.id,
              is_active: true,
            })
        }
      }

      // 4. Redirigir al dashboard
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
          <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
          <CardDescription className="text-slate-400">
            Usa tu cuenta de Starbooks para acceder
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
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
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            <p className="text-sm text-slate-400 text-center">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
