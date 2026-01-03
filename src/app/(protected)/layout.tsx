import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopSidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificar autenticacion
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener datos del estudiante usando el ID del metadata
  const studentId = user.user_metadata?.student_id

  if (!studentId) {
    // Usuario autenticado pero sin student_id en metadata
    // Esto puede pasar si el usuario fue creado de otra forma
    redirect('/login')
  }

  const { data: student, error } = await supabase
    .from('students')
    .select('id, student_code, full_name, email, avatar_url, subscription_status, subscription_type, subscription_end_date')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    redirect('/login')
  }

  // Verificar que la suscripcion este activa
  if (student.subscription_status !== 'active') {
    // Verificar si la suscripcion expiro
    if (student.subscription_end_date && new Date(student.subscription_end_date) < new Date()) {
      redirect('/subscription-expired')
    }
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
