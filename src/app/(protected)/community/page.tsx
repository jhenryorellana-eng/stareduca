'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, TrendingUp, Bell, Users } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostCard } from '@/components/community/PostCard'
import { CreatePostForm } from '@/components/community/CreatePostForm'

interface Author {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
  role: string
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
}

interface CurrentStudent {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStudent, setCurrentStudent] = useState<CurrentStudent | null>(null)
  const [filter, setFilter] = useState<'all' | 'announcements'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await fetch(`/api/community/posts?page=${pageNum}&limit=20`)
      const data = await response.json()

      if (data.success) {
        if (append) {
          setPosts(prev => [...prev, ...data.posts])
        } else {
          setPosts(data.posts)
        }
        setHasMore(pageNum < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

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
    fetchPosts(1)
  }, [fetchPosts, fetchCurrentStudent])

  const handleCreatePost = async (data: { content: string; imageFile?: File }) => {
    const formData = new FormData()
    formData.append('content', data.content)
    if (data.imageFile) {
      formData.append('image', data.imageFile)
    }

    const response = await fetch('/api/community/posts', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error)
    }

    // Agregar post al inicio
    setPosts(prev => [result.post, ...prev])
  }

  const handleReact = async (postId: string, type: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const result = await response.json()
      if (result.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userReaction: result.reaction,
              reactions_count: result.reactions_count
            }
          }
          return post
        }))
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('¿Estas seguro de eliminar esta publicacion?')) return

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        setPosts(prev => prev.filter(post => post.id !== postId))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage, true)
    }
  }

  // Filtrar posts
  const filteredPosts = filter === 'announcements'
    ? posts.filter(p => p.is_announcement)
    : posts

  // Ordenar: pinned primero
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return 0
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Comunidad</h1>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'announcements')}>
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600 text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Todo
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-indigo-600 text-white">
              <Bell className="h-4 w-4 mr-2" />
              Anuncios
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Create Post */}
      {currentStudent && (
        <CreatePostForm
          currentStudent={currentStudent}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {filter === 'announcements'
                ? 'No hay anuncios'
                : 'Se el primero en publicar'
              }
            </h3>
            <p className="text-slate-400">
              {filter === 'announcements'
                ? 'Los anuncios importantes apareceran aqui'
                : 'Comparte algo con la comunidad'
              }
            </p>
          </div>
        ) : (
          sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentStudentId={currentStudent?.id}
              onReact={handleReact}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Load more */}
        {hasMore && sortedPosts.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {loadingMore ? (
                <Loader2 className="h-5 w-5 animate-spin inline" />
              ) : (
                'Cargar mas'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
