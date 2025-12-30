import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopSidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener datos del afiliado
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select(`
      *,
      profile:profiles!affiliates_user_id_fkey(username, avatar_url),
      app:apps!affiliates_app_id_fkey(name, slug)
    `)
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    redirect('/register')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Desktop Sidebar - Fixed on left side, hidden on mobile */}
      <DesktopSidebar affiliate={affiliate} />

      {/* Main content area - Pushed right on desktop */}
      <div className="lg:pl-64">
        <Header affiliate={affiliate} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
