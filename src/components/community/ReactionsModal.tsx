'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Heart,
  ThumbsUp,
  PartyPopper,
  Lightbulb,
  HelpCircle,
  User,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
}

interface ReactionsModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'post' | 'comment'
  targetId: string
}

const REACTION_CONFIG = [
  { type: 'like', icon: ThumbsUp, label: 'Me gusta', color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
  { type: 'love', icon: Heart, label: 'Me encanta', color: 'text-red-400', bgColor: 'bg-red-400/20' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrar', color: 'text-green-400', bgColor: 'bg-green-400/20' },
  { type: 'insightful', icon: Lightbulb, label: 'Interesante', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20' },
  { type: 'curious', icon: HelpCircle, label: 'Curioso', color: 'text-purple-400', bgColor: 'bg-purple-400/20' },
]

export function ReactionsModal({ isOpen, onClose, targetType, targetId }: ReactionsModalProps) {
  const [reactions, setReactions] = useState<Record<string, Student[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchReactions()
    }
  }, [isOpen, targetId, targetType])

  const fetchReactions = async () => {
    setLoading(true)
    try {
      const endpoint = targetType === 'post'
        ? `/api/community/posts/${targetId}/reactions`
        : `/api/community/comments/${targetId}/reactions`

      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success) {
        setReactions(data.reactions)
        setTotal(data.total)

        // Seleccionar la primera tab con reacciones
        const firstType = REACTION_CONFIG.find(r => data.reactions[r.type]?.length > 0)?.type
        setSelectedTab(firstType || null)
      }
    } catch (error) {
      console.error('Error fetching reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Obtener las reacciones de la tab seleccionada
  const currentReactions = selectedTab ? reactions[selectedTab] || [] : []

  // Contar reacciones por tipo
  const reactionCounts = REACTION_CONFIG.map(r => ({
    ...r,
    count: reactions[r.type]?.length || 0
  })).filter(r => r.count > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">
            Reacciones {total > 0 && `(${total})`}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ThumbsUp className="h-10 w-10 mb-2 opacity-50" />
            <p>Aun no hay reacciones</p>
          </div>
        ) : (
          <>
            {/* Tabs de tipos de reaccion */}
            {reactionCounts.length > 1 && (
              <div className="flex gap-1 px-4 py-2 border-b border-slate-700/50 overflow-x-auto">
                {reactionCounts.map((reaction) => {
                  const Icon = reaction.icon
                  const isSelected = selectedTab === reaction.type

                  return (
                    <button
                      key={reaction.type}
                      onClick={() => setSelectedTab(reaction.type)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                        isSelected
                          ? `${reaction.bgColor} ${reaction.color}`
                          : "text-slate-400 hover:bg-slate-700/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{reaction.count}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Lista de personas */}
            <div className="max-h-80 overflow-y-auto">
              {currentReactions.map((student) => {
                const reactionConfig = REACTION_CONFIG.find(r => r.type === selectedTab)
                const Icon = reactionConfig?.icon || ThumbsUp

                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
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
                      {/* Icono de reaccion */}
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
                        reactionConfig?.bgColor || 'bg-slate-600'
                      )}>
                        <Icon className={cn("h-3 w-3", reactionConfig?.color || 'text-slate-400')} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        @{student.student_code}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
