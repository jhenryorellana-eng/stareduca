'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  User,
  Mail,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Save,
  Camera,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  email: string
  generated_email: string
  student_code: string
  full_name: string
  avatar_url: string | null
  subscription_status: string
  subscription_type: string
  subscription_end_date: string | null
}

interface NotificationPreferences {
  email_comments: boolean
  email_reactions: boolean
  email_mentions: boolean
  email_course_updates: boolean
  email_subscription: boolean
  email_affiliate: boolean
  email_marketing: boolean
  push_enabled: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [studentRes, prefsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/settings/notifications')
      ])

      const studentData = await studentRes.json()
      const prefsData = await prefsRes.json()

      if (studentData.success) {
        setStudent(studentData.student)
        setFullName(studentData.student.full_name)
        setAvatarUrl(studentData.student.avatar_url || '')
      }

      if (prefsData.success) {
        setPreferences(prefsData.preferences)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null
        })
      })

      const data = await response.json()
      if (data.success) {
        setStudent(prev => prev ? { ...prev, full_name: fullName, avatar_url: avatarUrl || null } : null)
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del servidor' })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!preferences) return

    const newValue = !preferences[key]
    setPreferences({ ...preferences, [key]: newValue })

    try {
      await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue })
      })
    } catch (error) {
      // Revertir si falla
      setPreferences({ ...preferences, [key]: !newValue })
    }
  }

  const isValidPassword = (pwd: string) => {
    return pwd.length >= 8 && /^[a-zA-Z0-9]+$/.test(pwd)
  }

  const handleChangePassword = async () => {
    setPasswordMessage(null)

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Todos los campos son requeridos' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contrasenas nuevas no coinciden' })
      return
    }

    if (!isValidPassword(newPassword)) {
      setPasswordMessage({ type: 'error', text: 'La contrasena debe tener minimo 8 caracteres y solo letras y numeros' })
      return
    }

    setSavingPassword(true)

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      })

      const data = await response.json()

      if (data.success) {
        setPasswordMessage({ type: 'success', text: 'Contrasena actualizada correctamente' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Error al cambiar contrasena' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Error del servidor' })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!student) return null

  const subscriptionEndDate = student.subscription_end_date
    ? new Date(student.subscription_end_date)
    : null
  const daysLeft = subscriptionEndDate
    ? Math.ceil((subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Configuracion</h1>

      {/* Message */}
      {message && (
        <div className={cn(
          "flex items-center gap-2 p-4 rounded-lg",
          message.type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        )}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Perfil</h2>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-700 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-1 block">URL de avatar</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Student code (read only) */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Codigo de estudiante</label>
            <div className="px-3 py-2 text-sm bg-slate-700/30 border border-slate-700 rounded-lg text-slate-400">
              {student.student_code}
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={saving || !fullName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Email addresses */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Correos electronicos</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <p className="text-sm font-medium text-white">{student.email}</p>
              <p className="text-xs text-slate-400">Email personal</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400">Principal</Badge>
          </div>

          {student.generated_email && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div>
                <p className="text-sm font-medium text-white">{student.generated_email}</p>
                <p className="text-xs text-slate-400">Email de plataforma</p>
              </div>
              <Badge className="bg-indigo-500/20 text-indigo-400">Generado</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Subscription */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Suscripcion</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Estado</span>
            <Badge className={cn(
              student.subscription_status === 'active'
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            )}>
              {student.subscription_status === 'active' ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Plan</span>
            <span className="text-white capitalize">
              {student.subscription_type === 'yearly' ? 'Anual' : 'Mensual'}
            </span>
          </div>

          {subscriptionEndDate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Proxima renovacion</span>
              <span className="text-white">
                {subscriptionEndDate.toLocaleDateString('es-ES')}
                {daysLeft && daysLeft > 0 && (
                  <span className="text-slate-500 ml-2">({daysLeft} dias)</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {preferences && (
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'email_comments', label: 'Comentarios', desc: 'Cuando alguien comenta en tus posts' },
              { key: 'email_reactions', label: 'Reacciones', desc: 'Cuando alguien reacciona a tu contenido' },
              { key: 'email_mentions', label: 'Menciones', desc: 'Cuando alguien te menciona' },
              { key: 'email_course_updates', label: 'Cursos', desc: 'Nuevos cursos y actualizaciones' },
              { key: 'email_affiliate', label: 'Afiliados', desc: 'Comisiones y referidos' },
              { key: 'email_marketing', label: 'Marketing', desc: 'Promociones y ofertas especiales' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <Switch
                  checked={preferences[key as keyof NotificationPreferences]}
                  onCheckedChange={() => handleTogglePreference(key as keyof NotificationPreferences)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security - Change Password */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Seguridad</h2>
        </div>

        <div className="space-y-4">
          {/* Password message */}
          {passwordMessage && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg text-sm",
              passwordMessage.type === 'success' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}>
              {passwordMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          {/* Current password */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Contrasena actual</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Tu contrasena actual"
                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nueva contrasena</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Solo letras y numeros</p>
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Confirmar nueva contrasena</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contrasena"
                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <KeyRound className="h-4 w-4 mr-2" />
            )}
            Cambiar contrasena
          </Button>

          {/* Forgot password link */}
          <div className="pt-2 border-t border-slate-700/50">
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              ¿Olvidaste tu contrasena? Recuperala por email
            </Link>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-red-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Cerrar sesion</h3>
            <p className="text-sm text-slate-400">Saldras de tu cuenta en este dispositivo</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent hover:bg-red-400"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesion
          </Button>
        </div>
      </div>
    </div>
  )
}
