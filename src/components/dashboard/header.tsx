'use client'

import { useState } from 'react'
import { Menu, Bell, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileSidebar } from './sidebar'
import { APP_URL } from '@/lib/constants'

interface HeaderProps {
  affiliate: {
    id: string
    student_code: string
    referral_code: string
    pending_balance_cents?: number
    profile?: {
      username?: string
      avatar_url?: string
    }
    app?: {
      name?: string
      slug?: string
    }
  }
}

export function Header({ affiliate }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const referralLink = `${APP_URL}/${affiliate.app?.slug || 'starbooks'}/ref/${affiliate.referral_code}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const pendingBalance = (affiliate.pending_balance_cents || 0) / 100

  return (
    <>
      <MobileSidebar
        affiliate={affiliate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Quick link copy */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-600">
                <span className="text-xs text-slate-400 hidden md:inline">Tu link:</span>
                <span className="text-sm text-indigo-400 font-mono truncate max-w-[200px]">
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                  title="Copiar link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Balance */}
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-400">Balance pendiente</p>
              <p className="text-sm font-semibold text-green-400">
                ${pendingBalance.toFixed(2)}
              </p>
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-400 hover:text-white"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" /> */}
            </Button>

            {/* User avatar (mobile) */}
            <div className="lg:hidden h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
              {affiliate.profile?.avatar_url ? (
                <img
                  src={affiliate.profile.avatar_url}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-slate-400 text-sm font-medium">
                  {affiliate.profile?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
