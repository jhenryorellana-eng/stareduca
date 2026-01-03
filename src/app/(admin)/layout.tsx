import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('sb-access-token')?.value

  if (!authToken) {
    redirect('/login')
  }

  // Verificar sesion
  const { data: { user } } = await supabase.auth.getUser(authToken)

  if (!user) {
    redirect('/login')
  }

  const studentId = user.user_metadata?.student_id

  if (!studentId) {
    redirect('/login')
  }

  // Verificar que es admin
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, avatar_url, student_code, role')
    .eq('id', studentId)
    .single()

  if (!student || student.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <AdminSidebar student={student} />

      {/* Main content */}
      <div className="lg:pl-72">
        <AdminHeader student={student} />

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
