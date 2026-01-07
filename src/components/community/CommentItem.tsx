'use client'

import { useState } from 'react'
import {
  ThumbsUp,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
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
import { ReactionsModal } from './ReactionsModal'

interface Author {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
  role?: string
}

interface Comment {
  id: string
  content: string
  reactions_count: number
  created_at: string
  author: Author
  userReaction: string | null
  parent_comment_id: string | null
  replies?: Comment[]
}

interface CommentItemProps {
  comment: Comment
  currentStudentId?: string
  onReply?: (commentId: string) => void
  onReact?: (commentId: string, type: string) => void
  onDelete?: (commentId: string) => void
  isReply?: boolean
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

function parseContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(@\w+)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className="text-indigo-400">
        {match[1]}
      </span>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return parts
}

export function CommentItem({
  comment,
  currentStudentId,
  onReply,
  onReact,
  onDelete,
  isReply = false
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const isAuthor = currentStudentId === comment.author.id

  return (
    <div className={cn("group", isReply && "ml-10 mt-3")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={cn(
          "rounded-full bg-slate-700 overflow-hidden flex-shrink-0",
          isReply ? "h-8 w-8" : "h-9 w-9"
        )}>
          {comment.author.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className={cn("text-slate-400", isReply ? "h-4 w-4" : "h-5 w-5")} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Comment bubble */}
          <div className="inline-block px-4 py-2 rounded-2xl bg-slate-700/50 max-w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {comment.author.full_name}
              </span>
              {comment.author.role === 'admin' && (
                <span className="px-1 py-0.5 text-xs rounded bg-indigo-500/20 text-indigo-400">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
              {parseContent(comment.content)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 ml-2">
            <span className="text-xs text-slate-500">
              {formatTimeAgo(comment.created_at)}
            </span>

            <button
              onClick={() => onReact?.(comment.id, 'like')}
              className={cn(
                "text-xs font-medium transition-colors",
                comment.userReaction
                  ? "text-indigo-400"
                  : "text-slate-500 hover:text-indigo-400"
              )}
            >
              Me gusta
            </button>

            {comment.reactions_count > 0 && (
              <button
                onClick={() => setShowReactionsModal(true)}
                className={cn(
                  "text-xs font-medium transition-colors hover:underline",
                  comment.userReaction
                    ? "text-indigo-400"
                    : "text-slate-500 hover:text-indigo-400"
                )}
              >
                {comment.reactions_count}
              </button>
            )}

            {!isReply && (
              <button
                onClick={() => onReply?.(comment.id)}
                className="text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors"
              >
                Responder
              </button>
            )}

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem
                    onClick={() => onDelete?.(comment.id)}
                    className="text-red-400 focus:bg-slate-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.length > 2 && !showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-sm text-indigo-400 hover:underline ml-2"
                >
                  Ver {comment.replies.length} respuestas
                </button>
              )}

              {(showReplies || comment.replies.length <= 2) && (
                <div className="space-y-0">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentStudentId={currentStudentId}
                      onReact={onReact}
                      onDelete={onDelete}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reactions Modal */}
      <ReactionsModal
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        targetType="comment"
        targetId={comment.id}
      />
    </div>
  )
}
