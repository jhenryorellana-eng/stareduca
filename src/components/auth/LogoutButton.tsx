'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton({ className }: { className?: string }) {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Cerrar Sesion
    </Button>
  )
}
