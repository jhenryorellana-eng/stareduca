'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Loader2,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Crown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  student_code: string
  full_name: string
  email: string
  phone: string | null
  country: string | null
  role: string
  subscription_status: string
  subscription_type: string | null
  subscription_expires_at: string | null
  created_at: string
  last_login_at: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchStudents = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/admin/students?${params}`)
      const data = await response.json()

      if (data.success) {
        setStudents(data.students)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => fetchStudents(1), 300)
    return () => clearTimeout(timeout)
  }, [search, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">Activo</Badge>
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400">Expirado</Badge>
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400">Pendiente</Badge>
      case 'cancelled':
        return <Badge className="bg-slate-500/20 text-slate-400">Cancelado</Badge>
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '--'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatRelativeTime = (date: string | null) => {
    if (!date) return 'Nunca'
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return formatDate(date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estudiantes</h1>
          <p className="text-sm text-slate-400">{pagination.total} estudiantes registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o codigo..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white outline-none focus:border-indigo-500/50"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="expired">Expirados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {search || statusFilter ? 'No se encontraron estudiantes' : 'No hay estudiantes'}
          </h3>
          <p className="text-slate-400">
            {search || statusFilter ? 'Intenta con otros filtros' : 'Los estudiantes apareceran aqui cuando se registren'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-slate-800/50 border border-slate-700/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Estudiante</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Codigo</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Suscripcion</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Registro</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Ultimo acceso</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{student.full_name}</p>
                            {student.role === 'admin' && (
                              <Crown className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {student.email}
                            </span>
                            {student.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {student.phone}
                              </span>
                            )}
                            {student.country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {student.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="px-2 py-1 rounded bg-slate-700 text-indigo-300 text-sm">
                        {student.student_code}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {getStatusBadge(student.subscription_status)}
                        {student.subscription_type && (
                          <p className="text-xs text-slate-500 capitalize">{student.subscription_type}</p>
                        )}
                        {student.subscription_expires_at && (
                          <p className="text-xs text-slate-500">
                            Expira: {formatDate(student.subscription_expires_at)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {formatDate(student.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        {formatRelativeTime(student.last_login_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4">
              <p className="text-sm text-slate-400">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchStudents(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-400">
                  Pagina {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchStudents(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
