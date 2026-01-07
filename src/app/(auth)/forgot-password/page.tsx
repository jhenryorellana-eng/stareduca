'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, studentCode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud')
      }

      setSuccess(true)

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
            <CardTitle className="text-2xl text-white">Revisa tu Email</CardTitle>
            <CardDescription className="text-slate-400">
              Si los datos son correctos, recibiras un email con instrucciones para recuperar tu contrasena.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <p className="text-sm text-slate-300 text-center">
                El enlace expirara en <strong className="text-white">1 hora</strong>
              </p>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Si no recibes el email, revisa tu carpeta de spam o solicita uno nuevo.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
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
            <Mail className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Recuperar Contrasena</CardTitle>
          <CardDescription className="text-slate-400">
            Ingresa tu email personal y codigo de estudiante para recibir instrucciones
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
              <Label htmlFor="email" className="text-slate-300">
                Email Personal
              </Label>
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
                El email que usaste para registrarte (no el generado por la plataforma)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentCode" className="text-slate-300">
                Codigo de Estudiante
              </Label>
              <Input
                id="studentCode"
                type="text"
                placeholder="ABC-123456"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                required
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 font-mono"
              />
              <p className="text-xs text-slate-500">
                Tu codigo unico de estudiante
              </p>
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
                  Enviando...
                </>
              ) : (
                'Enviar Instrucciones'
              )}
            </Button>

            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Iniciar Sesion
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
