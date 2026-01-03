'use client'

import { Bell, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface AdminHeaderProps {
  student: {
    id: string
    full_name: string
    avatar_url: string | null
    student_code: string
    role: string
  }
}

export function AdminHeader({ student }: AdminHeaderProps) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left side - Title placeholder for mobile */}
        <div className="lg:hidden w-10" />

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-slate-700 overflow-hidden">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{student.full_name}</p>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white">{student.full_name}</p>
                <p className="text-xs text-slate-400">{student.student_code}</p>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer text-slate-300 focus:bg-slate-700">
                  Vista estudiante
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer text-slate-300 focus:bg-slate-700">
                  Configuracion
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:bg-slate-700 cursor-pointer"
              >
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
