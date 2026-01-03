'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  ThumbsUp,
  Sparkles,
  Lightbulb,
  HelpCircle,
  PartyPopper,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Author {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
  role: string
}

interface PostCardProps {
  post: {
    id: string
    content: string
    image_url: string | null
    is_pinned: boolean
    is_announcement: boolean
    reactions_count: number
    comments_count: number
    created_at: string
    author: Author
    userReaction: string | null
  }
  currentStudentId?: string
  onReact?: (postId: string, type: string) => void
  onDelete?: (postId: string) => void
  onEdit?: (postId: string) => void
  compact?: boolean
}

const REACTIONS = [
  { type: 'like', icon: ThumbsUp, label: 'Me gusta', color: 'text-blue-400' },
  { type: 'love', icon: Heart, label: 'Me encanta', color: 'text-red-400' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrar', color: 'text-green-400' },
  { type: 'insightful', icon: Lightbulb, label: 'Interesante', color: 'text-yellow-400' },
  { type: 'curious', icon: HelpCircle, label: 'Curioso', color: 'text-purple-400' },
]

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

function parseContent(content: string): React.ReactNode[] {
  // Parsear menciones @usuario y URLs
  const parts: React.ReactNode[] = []
  const regex = /(@\w+)|(https?:\/\/[^\s]+)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    // Texto antes del match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }

    if (match[1]) {
      // Mencion
      parts.push(
        <span key={match.index} className="text-indigo-400 hover:underline cursor-pointer">
          {match[1]}
        </span>
      )
    } else if (match[2]) {
      // URL
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline"
        >
          {match[2].length > 40 ? match[2].substring(0, 40) + '...' : match[2]}
        </a>
      )
    }

    lastIndex = regex.lastIndex
  }

  // Texto restante
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return parts
}

export function PostCard({
  post,
  currentStudentId,
  onReact,
  onDelete,
  onEdit,
  compact = false
}: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [isReacting, setIsReacting] = useState(false)

  const isAuthor = currentStudentId === post.author.id
  const isAdmin = post.author.role === 'admin'
  const currentReaction = REACTIONS.find(r => r.type === post.userReaction)

  const handleReact = async (type: string) => {
    if (isReacting || !onReact) return
    setIsReacting(true)
    setShowReactions(false)
    try {
      await onReact(post.id, type)
    } finally {
      setIsReacting(false)
    }
  }

  return (
    <article className={cn(
      "p-4 sm:p-6 rounded-xl bg-slate-800/50 border border-slate-700/50",
      post.is_pinned && "border-indigo-500/30 bg-indigo-900/10",
      post.is_announcement && "border-amber-500/30 bg-amber-900/10"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            )}
          </div>

          {/* Author info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white truncate">
                {post.author.full_name}
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-indigo-500/20 text-indigo-400">
                  Admin
                </span>
              )}
              {post.is_pinned && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-indigo-500/20 text-indigo-400">
                  Fijado
                </span>
              )}
              {post.is_announcement && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">
                  Anuncio
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>@{post.author.student_code}</span>
              <span>·</span>
              <span>{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        {(isAuthor || post.author.role === 'admin') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              {isAuthor && (
                <DropdownMenuItem
                  onClick={() => onEdit?.(post.id)}
                  className="text-slate-300 focus:bg-slate-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete?.(post.id)}
                className="text-red-400 focus:bg-slate-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        <p className={cn(
          "text-slate-300 whitespace-pre-wrap break-words",
          compact && "line-clamp-4"
        )}>
          {parseContent(post.content)}
        </p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mt-4 rounded-xl overflow-hidden">
          <img
            src={post.image_url}
            alt=""
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-1">
        {/* Reaction button with popup */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 text-slate-400 hover:text-white",
              post.userReaction && currentReaction?.color
            )}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => {
              if (post.userReaction) {
                handleReact(post.userReaction)
              } else {
                handleReact('like')
              }
            }}
          >
            {currentReaction ? (
              <currentReaction.icon className="h-4 w-4" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            <span>{post.reactions_count || ''}</span>
          </Button>

          {/* Reactions popup */}
          {showReactions && (
            <div
              className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-full bg-slate-700 border border-slate-600 shadow-lg z-10"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReact(reaction.type)}
                  className={cn(
                    "p-2 rounded-full transition-transform hover:scale-125",
                    post.userReaction === reaction.type ? 'bg-slate-600' : 'hover:bg-slate-600'
                  )}
                  title={reaction.label}
                >
                  <reaction.icon className={cn("h-5 w-5", reaction.color)} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments button */}
        <Link href={`/community/post/${post.id}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count || ''}</span>
          </Button>
        </Link>
      </div>
    </article>
  )
}
