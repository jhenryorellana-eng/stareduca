'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Share2,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface StudentSidebarProps {
  student: {
    id: string
    student_code: string
    full_name: string
    email: string
    avatar_url?: string | null
    subscription_status: string
    subscription_type: string
  }
  onClose?: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Vista general' },
  { name: 'Cursos', href: '/courses', icon: GraduationCap, description: 'Todos los cursos' },
  { name: 'Comunidad', href: '/community', icon: Users, description: 'Feed y posts' },
  { name: 'Afiliados', href: '/affiliate', icon: Share2, description: 'Gana comisiones' },
  { name: 'Configuracion', href: '/settings', icon: Settings, description: 'Tu cuenta' },
]

export function Sidebar({ student, onClose }: StudentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700/50">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">StarEduca</span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-2 -m-2 rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-2 ring-slate-600">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt="Avatar"
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {getInitials(student.full_name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {student.full_name}
            </p>
            <Badge
              variant="outline"
              className={cn(
                'mt-1 text-xs',
                student.subscription_status === 'active'
                  ? 'border-green-500/50 text-green-400'
                  : 'border-amber-500/50 text-amber-400'
              )}
            >
              {student.subscription_type === 'yearly' ? 'Plan Anual' : 'Plan Mensual'}
            </Badge>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Codigo de estudiante</p>
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400 mt-1">
            {student.student_code}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu Principal
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-500'
                  : 'bg-slate-700/50 group-hover:bg-slate-600/50'
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="block">{item.name}</span>
                {!isActive && (
                  <span className="block text-xs text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick Access */}
      <div className="p-3 border-t border-slate-700/50">
        <Link
          href="/courses"
          className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all group"
        >
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Continuar aprendiendo</p>
            <p className="text-xs text-slate-400">Retoma tu ultimo curso</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </Link>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 disabled:opacity-50 group"
        >
          <div className="p-1.5 rounded-lg bg-slate-700/50 group-hover:bg-red-500/20 transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          {isLoggingOut ? 'Cerrando sesion...' : 'Cerrar Sesion'}
        </button>
      </div>
    </div>
  )
}

// Mobile sidebar wrapper with animations
export function MobileSidebar({ student, isOpen, onClose }: StudentSidebarProps & { isOpen: boolean }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 lg:hidden transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar student={student} onClose={onClose} />
      </div>
    </>
  )
}

// Desktop sidebar wrapper
export function DesktopSidebar({ student }: Omit<StudentSidebarProps, 'onClose'>) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <Sidebar student={student} />
    </div>
  )
}
