'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Heart,
  MessageCircle,
  AtSign,
  BookOpen,
  CreditCard,
  Info,
  Award,
  Users,
  Check,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

const NOTIFICATION_ICONS: Record<string, typeof Heart> = {
  reaction: Heart,
  comment: MessageCircle,
  mention: AtSign,
  course: BookOpen,
  subscription: CreditCard,
  system: Info,
  achievement: Award,
  affiliate: Users
}

const NOTIFICATION_COLORS: Record<string, string> = {
  reaction: 'text-red-400',
  comment: 'text-blue-400',
  mention: 'text-indigo-400',
  course: 'text-green-400',
  subscription: 'text-amber-400',
  system: 'text-slate-400',
  achievement: 'text-yellow-400',
  affiliate: 'text-purple-400'
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Ahora'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function NotificationDropdown() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=20')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH'
        })
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to action URL
    if (notification.action_url) {
      setIsOpen(false)
      router.push(notification.action_url)
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (markingAllRead || unreadCount === 0) return

    setMarkingAllRead(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH'
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-white hover:bg-slate-700/50 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {markingAllRead ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Marcar todas
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Info
                  const iconColor = NOTIFICATION_COLORS[notification.type] || 'text-slate-400'

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors",
                        !notification.is_read && "bg-indigo-500/5"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
                        !notification.is_read ? "bg-indigo-500/20" : "bg-slate-700"
                      )}>
                        <Icon className={cn("h-4 w-4", iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm",
                          notification.is_read ? "text-slate-400" : "text-white"
                        )}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0 h-2 w-2 rounded-full bg-indigo-500 mt-2" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
