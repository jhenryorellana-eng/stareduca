'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Send,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/community/PostCard'
import { CommentItem } from '@/components/community/CommentItem'

interface Author {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
  role: string
}

interface Comment {
  id: string
  content: string
  reactions_count: number
  created_at: string
  parent_comment_id: string | null
  author: Author
  userReaction: string | null
  replies?: Comment[]
}

interface Post {
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
  comments: Comment[]
}

interface CurrentStudent {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStudent, setCurrentStudent] = useState<CurrentStudent | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`)
      const data = await response.json()

      if (data.success) {
        setPost(data.post)
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }, [postId])

  const fetchCurrentStudent = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success && data.student) {
        setCurrentStudent({
          id: data.student.id,
          full_name: data.student.full_name,
          avatar_url: data.student.avatar_url,
          student_code: data.student.student_code
        })
      }
    } catch (error) {
      console.error('Error fetching current student:', error)
    }
  }, [])

  useEffect(() => {
    fetchCurrentStudent()
    fetchPost()
  }, [fetchPost, fetchCurrentStudent])

  const handleReactToPost = async (postId: string, type: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const result = await response.json()
      if (result.success && post) {
        setPost({
          ...post,
          userReaction: result.reaction,
          reactions_count: result.reactions_count
        })
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
    }
  }

  const handleReactToComment = async (commentId: string, type: string) => {
    try {
      const response = await fetch(`/api/community/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const result = await response.json()
      if (result.success && post) {
        // Actualizar el comentario en el estado
        const updateComments = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                userReaction: result.reaction,
                reactions_count: result.reactions_count
              }
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: updateComments(comment.replies)
              }
            }
            return comment
          })
        }

        setPost({
          ...post,
          comments: updateComments(post.comments)
        })
      }
    } catch (error) {
      console.error('Error reacting to comment:', error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estas seguro de eliminar esta publicacion?')) return

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        router.push('/community')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estas seguro de eliminar este comentario?')) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success && post) {
        // Remover comentario del estado
        const removeComment = (comments: Comment[]): Comment[] => {
          return comments
            .filter(c => c.id !== commentId)
            .map(c => ({
              ...c,
              replies: c.replies ? removeComment(c.replies) : []
            }))
        }

        setPost({
          ...post,
          comments: removeComment(post.comments),
          comments_count: post.comments_count - 1
        })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    commentInputRef.current?.focus()
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim() || submitting) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentContent.trim(),
          parent_comment_id: replyingTo
        })
      })

      const result = await response.json()
      if (result.success && post) {
        // Agregar comentario al estado
        if (replyingTo) {
          // Es una respuesta
          const addReply = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === replyingTo) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), result.comment]
                }
              }
              return comment
            })
          }
          setPost({
            ...post,
            comments: addReply(post.comments),
            comments_count: post.comments_count + 1
          })
        } else {
          // Es un comentario nuevo
          setPost({
            ...post,
            comments: [...post.comments, result.comment],
            comments_count: post.comments_count + 1
          })
        }

        setCommentContent('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-slate-400 mb-4">Publicacion no encontrada</p>
        <Link href="/community">
          <Button>Volver a la comunidad</Button>
        </Link>
      </div>
    )
  }

  const replyingToComment = replyingTo
    ? post.comments.find(c => c.id === replyingTo) ||
      post.comments.flatMap(c => c.replies || []).find(c => c.id === replyingTo)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => router.push('/community')}
        className="text-slate-400 hover:text-white -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a la comunidad
      </Button>

      {/* Post */}
      <PostCard
        post={post}
        currentStudentId={currentStudent?.id}
        onReact={handleReactToPost}
        onDelete={handleDeletePost}
      />

      {/* Comment form */}
      {currentStudent && (
        <form
          onSubmit={handleSubmitComment}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          {replyingTo && replyingToComment && (
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
              <span>Respondiendo a</span>
              <span className="text-indigo-400">@{replyingToComment.author.student_code}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-slate-500 hover:text-white"
              >
                × Cancelar
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
              {currentStudent.avatar_url ? (
                <img
                  src={currentStudent.avatar_url}
                  alt={currentStudent.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <textarea
                ref={commentInputRef}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={2}
                className="w-full bg-transparent text-white placeholder-slate-500 resize-none outline-none text-sm"
              />
            </div>

            <Button
              type="submit"
              size="icon"
              disabled={!commentContent.trim() || submitting}
              className="bg-indigo-600 hover:bg-indigo-700 h-9 w-9"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          {post.comments_count} {post.comments_count === 1 ? 'Comentario' : 'Comentarios'}
        </h3>

        {post.comments.length === 0 ? (
          <p className="text-center py-8 text-slate-400">
            Se el primero en comentar
          </p>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentStudentId={currentStudent?.id}
                onReply={handleReply}
                onReact={handleReactToComment}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
