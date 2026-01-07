'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  student: {
    id: string
    full_name: string
    avatar_url: string | null
    student_code: string
    role: string
  }
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Cursos', href: '/admin/courses', icon: GraduationCap },
  { name: 'Estudiantes', href: '/admin/students', icon: Users },
  { name: 'Suscripciones', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Configuracion', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar({ student }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">StarEduca</span>
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Admin</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Back to student view */}
      <div className="px-4 py-3">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent border-slate-700 text-slate-400 hover:text-white hover:bg-transparent py-5">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a estudiante
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-slate-700 overflow-hidden">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{student.full_name}</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesion
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-800 border-r border-slate-700/50 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col bg-slate-800 border-r border-slate-700/50">
        <SidebarContent />
      </div>
    </>
  )
}
