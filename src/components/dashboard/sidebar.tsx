'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Link2,
  CreditCard,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  affiliate: {
    id: string
    student_code: string
    referral_code: string
    profile?: {
      username?: string
      avatar_url?: string
    }
    app?: {
      name?: string
      slug?: string
    }
  }
  onClose?: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Vista general' },
  { name: 'Referidos', href: '/dashboard/referrals', icon: Users, description: 'Tus usuarios' },
  { name: 'Ganancias', href: '/dashboard/earnings', icon: DollarSign, description: 'Comisiones' },
  { name: 'Links', href: '/dashboard/links', icon: Link2, description: 'Tus enlaces' },
  { name: 'Pagos', href: '/dashboard/payouts', icon: CreditCard, description: 'Retiros' },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings, description: 'Ajustes' },
]

export function Sidebar({ affiliate, onClose }: SidebarProps) {
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

  const username = affiliate.profile?.username || 'Usuario'

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
        <Link
          href={`/u/${username}`}
          className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-700/30 transition-colors group"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-2 ring-slate-600 group-hover:ring-indigo-500/50 transition-all">
            {affiliate.profile?.avatar_url ? (
              <img
                src={affiliate.profile.avatar_url}
                alt="Avatar"
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              @{username}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {affiliate.app?.name || 'Starbooks'} Affiliate
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </Link>

        <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Código de estudiante</p>
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400 mt-1">
            {affiliate.student_code}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menú Principal
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href
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
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
        </button>
      </div>
    </div>
  )
}

// Mobile sidebar wrapper with animations
export function MobileSidebar({ affiliate, isOpen, onClose }: SidebarProps & { isOpen: boolean }) {
  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Sidebar with slide animation */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 lg:hidden transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar affiliate={affiliate} onClose={onClose} />
      </div>
    </>
  )
}

// Desktop sidebar wrapper
export function DesktopSidebar({ affiliate }: Omit<SidebarProps, 'onClose'>) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <Sidebar affiliate={affiliate} />
    </div>
  )
}
