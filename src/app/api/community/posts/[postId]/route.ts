import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/community/posts/[postId] - Obtener post individual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    // Obtener usuario autenticado
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const currentStudentId = user?.user_metadata?.student_id || null

    const { data: post, error } = await serviceClient
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        is_pinned,
        is_announcement,
        reactions_count,
        comments_count,
        created_at,
        updated_at,
        author:students!author_id (
          id,
          full_name,
          avatar_url,
          student_code,
          role
        )
      `)
      .eq('id', postId)
      .single()

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: 'Publicacion no encontrada' },
        { status: 404 }
      )
    }

    // Obtener reaccion del usuario
    let userReaction = null
    if (currentStudentId) {
      const { data: reaction } = await serviceClient
        .from('reactions')
        .select('type')
        .eq('student_id', currentStudentId)
        .eq('target_type', 'post')
        .eq('target_id', postId)
        .single()

      if (reaction) {
        userReaction = reaction.type
      }
    }

    // Obtener comentarios del post
    const { data: comments } = await serviceClient
      .from('comments')
      .select(`
        id,
        content,
        reactions_count,
        created_at,
        parent_comment_id,
        author:students!author_id (
          id,
          full_name,
          avatar_url,
          student_code,
          role
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    // Si hay usuario, obtener sus reacciones a los comentarios
    let commentReactions: Record<string, string> = {}
    if (currentStudentId && comments && comments.length > 0) {
      const commentIds = comments.map(c => c.id)
      const { data: reactions } = await serviceClient
        .from('reactions')
        .select('target_id, type')
        .eq('student_id', currentStudentId)
        .eq('target_type', 'comment')
        .in('target_id', commentIds)

      if (reactions) {
        commentReactions = reactions.reduce((acc, r) => {
          acc[r.target_id] = r.type
          return acc
        }, {} as Record<string, string>)
      }
    }

    const commentsWithReactions = comments?.map(comment => ({
      ...comment,
      userReaction: commentReactions[comment.id] || null
    })) || []

    // Organizar comentarios en arbol (padres e hijos)
    const rootComments = commentsWithReactions.filter(c => !c.parent_comment_id)
    const replies = commentsWithReactions.filter(c => c.parent_comment_id)

    // Anidar respuestas en comentarios raiz
    const nestedComments = rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_comment_id === comment.id)
    }))

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        userReaction,
        comments: nestedComments
      }
    })

  } catch (error) {
    console.error('Error in GET /api/community/posts/[postId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/community/posts/[postId] - Eliminar post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 400 }
      )
    }

    // Verificar que el usuario es el autor o admin
    const { data: student } = await serviceClient
      .from('students')
      .select('role')
      .eq('id', studentId)
      .single()

    const { data: existingPost } = await serviceClient
      .from('posts')
      .select('author_id, image_url')
      .eq('id', postId)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Publicacion no encontrada' },
        { status: 404 }
      )
    }

    const isAuthor = existingPost.author_id === studentId
    const isAdmin = student?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar esta publicacion' },
        { status: 403 }
      )
    }

    // Eliminar imagen del storage si existe
    if (existingPost.image_url) {
      try {
        // Extraer el path de la imagen desde la URL
        const url = new URL(existingPost.image_url)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/post-images\/(.+)/)
        if (pathMatch) {
          const imagePath = pathMatch[1]
          await serviceClient.storage.from('post-images').remove([imagePath])
        }
      } catch (storageError) {
        console.error('Error deleting image from storage:', storageError)
        // Continuar con la eliminación del post aunque falle la imagen
      }
    }

    const { error } = await serviceClient
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar publicacion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/community/posts/[postId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
