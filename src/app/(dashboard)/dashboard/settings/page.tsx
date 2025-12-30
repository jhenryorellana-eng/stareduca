'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, Mail, User, CreditCard, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<{
    username: string
    email: string
  }>({ username: '', email: '' })

  const [affiliate, setAffiliate] = useState<{
    id: string
    student_code: string
    paypal_email: string
  }>({ id: '', student_code: '', paypal_email: '' })

  const [paypalEmail, setPaypalEmail] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      setProfile({
        username: profileData?.username || '',
        email: user.email || '',
      })

      // Get affiliate
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('id, student_code, paypal_email')
        .eq('user_id', user.id)
        .single()

      if (affiliateData) {
        setAffiliate(affiliateData)
        setPaypalEmail(affiliateData.paypal_email || '')
      }
    }
    setLoading(false)
  }

  const savePaypalEmail = async () => {
    if (!affiliate.id) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(paypalEmail)) {
        throw new Error('Por favor ingresa un email válido')
      }

      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('affiliates')
        .update({ paypal_email: paypalEmail })
        .eq('id', affiliate.id)

      if (updateError) throw updateError

      setAffiliate({ ...affiliate, paypal_email: paypalEmail })
      setSuccess('Email de PayPal actualizado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400">
          Administra tu cuenta y preferencias de pago.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Account Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            Información de Cuenta
          </CardTitle>
          <CardDescription className="text-slate-400">
            Tu información de cuenta de Starbooks (solo lectura).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Username</Label>
              <Input
                value={profile.username}
                disabled
                className="bg-slate-900 border-slate-600 text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                value={profile.email}
                disabled
                className="bg-slate-900 border-slate-600 text-slate-400"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Para cambiar estos datos, modifícalos en tu cuenta de Starbooks.
          </p>
        </CardContent>
      </Card>

      {/* Student Code */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            Código de Estudiante
          </CardTitle>
          <CardDescription className="text-slate-400">
            Tu código único de afiliado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-600">
            <p className="text-2xl font-mono font-bold text-indigo-400 text-center">
              {affiliate.student_code}
            </p>
          </div>
          <p className="text-sm text-slate-400 mt-3 text-center">
            Este código es único y permanente. Compártelo con tus contactos.
          </p>
        </CardContent>
      </Card>

      {/* PayPal Configuration */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-400" />
            Configuración de PayPal
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configura tu email de PayPal para recibir pagos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paypal_email" className="text-slate-300">
              Email de PayPal
            </Label>
            <div className="flex gap-2">
              <Input
                id="paypal_email"
                type="email"
                placeholder="tu@email.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={savePaypalEmail}
                disabled={saving || paypalEmail === affiliate.paypal_email}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {affiliate.paypal_email && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle className="h-4 w-4" />
              PayPal configurado correctamente
            </div>
          )}

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600">
            <h4 className="text-sm font-medium text-white mb-2">Importante:</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Asegúrate de que el email corresponda a una cuenta de PayPal activa.</li>
              <li>• Los pagos se enviarán a este email cuando solicites un retiro.</li>
              <li>• Puedes cambiar tu email de PayPal en cualquier momento.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-amber-400" />
            Notificaciones
          </CardTitle>
          <CardDescription className="text-slate-400">
            Preferencias de notificaciones por email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Nuevo referido</p>
                <p className="text-xs text-slate-400">Recibe un email cuando alguien use tu link</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Nueva comisión</p>
                <p className="text-xs text-slate-400">Recibe un email cuando ganes una comisión</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Pago procesado</p>
                <p className="text-xs text-slate-400">Recibe un email cuando se procese tu pago</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Las notificaciones por email están activas por defecto. Los cambios se guardan automáticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
