'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Bell, Search, ChevronDown, User, Settings, LogOut, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { MobileSidebar } from './Sidebar'

interface HeaderProps {
  student: {
    id: string
    student_code: string
    full_name: string
    email: string
    avatar_url?: string | null
    subscription_status: string
    subscription_type: string
  }
}

export function Header({ student }: HeaderProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const copyStudentCode = () => {
    navigator.clipboard.writeText(student.student_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 hidden sm:block">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cursos, capitulos..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Student Code Badge */}
          <button
            onClick={copyStudentCode}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-indigo-500/50 transition-colors group"
          >
            <span className="text-xs text-slate-400">Codigo:</span>
            <span className="font-mono font-bold text-indigo-400">{student.student_code}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
          </button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 hover:bg-slate-700/50"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt="Avatar"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {getInitials(student.full_name)}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{student.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {student.subscription_type === 'yearly' ? 'Plan Anual' : 'Plan Mensual'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-slate-800 border-slate-700 text-white"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{student.full_name}</span>
                  <span className="text-xs font-normal text-slate-400">{student.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />

              {/* Mobile only: Student Code */}
              <DropdownMenuItem
                onClick={copyStudentCode}
                className="md:hidden focus:bg-slate-700 focus:text-white cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-indigo-400">{student.student_code}</span>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden bg-slate-700" />

              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 focus:bg-slate-700 focus:text-white cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings/subscription"
                  className="flex items-center gap-2 focus:bg-slate-700 focus:text-white cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  Suscripcion
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar
        student={student}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  )
}
