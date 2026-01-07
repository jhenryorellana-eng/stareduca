import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DesktopSidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Verificar autenticacion
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // El middleware ya deberia haber redirigido
    // Si llegamos aqui, mostramos loading para evitar loop
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Verificando sesion...</p>
        </div>
      </div>
    )
  }

  // Obtener datos del estudiante usando el ID del metadata
  const studentId = user.user_metadata?.student_id

  if (!studentId) {
    // Usuario autenticado pero sin student_id en metadata
    console.error('No student_id in metadata. User:', user.id, user.email)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: Cuenta incompleta</p>
          <p className="text-slate-400 text-sm mb-6">No se encontro student_id en tu cuenta</p>
          <LogoutButton className="border-slate-600 text-slate-300 hover:bg-slate-800" />
        </div>
      </div>
    )
  }

  const { data: student, error } = await supabase
    .from('students')
    .select('id, student_code, full_name, email, avatar_url, role, subscription_status, subscription_type, subscription_end_date')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    // No se encontro el estudiante - debug info
    console.error('Error buscando estudiante:', error)
    console.log('StudentId buscado:', studentId)
    console.log('User Auth ID:', user.id)
    console.log('User Email:', user.email)

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: Estudiante no encontrado</p>
          <p className="text-slate-400 text-sm mb-2">StudentID: {studentId}</p>
          <p className="text-slate-500 text-xs mb-6">Revisa la consola del servidor para mas detalles</p>
          <LogoutButton className="border-slate-600 text-slate-300 hover:bg-slate-800" />
        </div>
      </div>
    )
  }

  // Verificar suscripcion activa para rutas protegidas
  // Excepciones: admins y rutas /settings/*
  const isSettingsRoute = pathname.startsWith('/settings')
  const isAdmin = student.role === 'admin'

  if (!isAdmin && !isSettingsRoute && student.subscription_status !== 'active') {
    // Usuario sin suscripcion activa intentando acceder a contenido premium
    redirect('/settings/subscription')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Desktop Sidebar */}
      <DesktopSidebar student={student} />

      {/* Main content area */}
      <div className="lg:pl-64">
        <Header student={student} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
