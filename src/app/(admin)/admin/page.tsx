'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  UserPlus,
  BookOpen,
  Loader2,
  ArrowRight,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Stats {
  totalStudents: number
  activeStudents: number
  newStudentsThisWeek: number
  totalCourses: number
  publishedCourses: number
  monthlyRevenue: number
  subscriptionsByType: {
    monthly: number
    yearly: number
  }
}

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
  student: {
    full_name: string
    student_code: string
  }
}

interface Signup {
  id: string
  full_name: string
  student_code: string
  created_at: string
  subscription_status: string
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [recentSignups, setRecentSignups] = useState<Signup[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()

        if (data.success) {
          setStats(data.stats)
          setRecentPayments(data.recentPayments)
          setRecentSignups(data.recentSignups)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link href="/admin/courses/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Nuevo curso
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Estudiantes activos</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.activeStudents}</p>
              <p className="text-xs text-slate-500 mt-1">de {stats.totalStudents} totales</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Ingresos del mes</p>
              <p className="text-3xl font-bold text-white mt-1">${stats.monthlyRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Este mes
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/20">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Nuevos esta semana</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.newStudentsThisWeek}</p>
              <p className="text-xs text-slate-500 mt-1">registros</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/20">
              <UserPlus className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Cursos publicados</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.publishedCourses}</p>
              <p className="text-xs text-slate-500 mt-1">de {stats.totalCourses} totales</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20">
              <GraduationCap className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Suscripciones por tipo</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-slate-300">Mensual</span>
              </div>
              <span className="text-white font-medium">{stats.subscriptionsByType.monthly}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-slate-300">Anual</span>
              </div>
              <span className="text-white font-medium">{stats.subscriptionsByType.yearly}</span>
            </div>
          </div>
        </div>

        {/* Recent payments */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pagos recientes</h3>
            <Link href="/admin/subscriptions" className="text-sm text-indigo-400 hover:text-indigo-300">
              Ver todos
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-center py-8 text-slate-400">No hay pagos recientes</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CreditCard className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{payment.student.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-400">+${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Registros recientes</h3>
          <Link href="/admin/students" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentSignups.length === 0 ? (
          <p className="text-center py-8 text-slate-400">No hay registros recientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Estudiante</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Codigo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((signup) => (
                  <tr key={signup.id} className="border-b border-slate-700/30 last:border-0">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{signup.full_name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-indigo-400">{signup.student_code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={cn(
                        "text-xs",
                        signup.subscription_status === 'active'
                          ? "bg-green-500/20 text-green-400"
                          : "bg-slate-500/20 text-slate-400"
                      )}>
                        {signup.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-400">
                        {new Date(signup.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
