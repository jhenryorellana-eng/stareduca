'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Loader2,
  Users,
  Mail,
  Calendar,
  Crown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  student_code: string
  full_name: string
  email: string
  generated_email: string
  role: string
  subscription_status: string
  subscription_type: string | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
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

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student)
    setDeleteConfirmText('')
    setDeleteError('')
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setStudentToDelete(null)
    setDeleteConfirmText('')
    setDeleteError('')
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return
    if (deleteConfirmText !== 'ELIMINAR') {
      setDeleteError('Debes escribir ELIMINAR para confirmar')
      return
    }

    setDeleting(true)
    setDeleteError('')

    try {
      const response = await fetch(`/api/admin/students/${studentToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        setDeleteError(data.error || 'Error al eliminar estudiante')
        return
      }

      // Cerrar modal y recargar lista
      closeDeleteModal()
      fetchStudents(pagination.page)
    } catch (error) {
      console.error('Error deleting student:', error)
      setDeleteError('Error al eliminar estudiante')
    } finally {
      setDeleting(false)
    }
  }

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
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Acciones</th>
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
                          <div className="flex flex-col gap-0.5 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {student.email || student.generated_email}
                            </span>
                            {student.stripe_customer_id && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" />
                                <span className="text-xs">{student.stripe_customer_id}</span>
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
                        {student.subscription_end_date && (
                          <p className="text-xs text-slate-500">
                            Expira: {formatDate(student.subscription_end_date)}
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
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(student)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Eliminar estudiante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Eliminar Estudiante
              </h3>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-400">Estudiante a eliminar:</p>
                <p className="font-medium text-white">{studentToDelete.full_name}</p>
                <p className="text-sm text-slate-500">{studentToDelete.email}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Codigo: {studentToDelete.student_code}
                </p>
              </div>

              <div className="text-sm text-slate-400">
                <p className="mb-2">Esta accion eliminara permanentemente:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Cuenta y perfil del estudiante</li>
                  <li>Posts, comentarios y reacciones</li>
                  <li>Progreso en todos los cursos</li>
                  <li>Historial de suscripciones y pagos</li>
                  <li>Datos de afiliado (si aplica)</li>
                  <li>Archivos en storage (avatar, imagenes)</li>
                </ul>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400 font-medium">
                  Esta accion NO se puede deshacer.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">
                  Escribe <span className="font-mono text-red-400">ELIMINAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-400">{deleteError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                className="flex-1 border-slate-700 text-slate-300"
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteStudent}
                disabled={deleting || deleteConfirmText !== 'ELIMINAR'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Permanentemente
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
