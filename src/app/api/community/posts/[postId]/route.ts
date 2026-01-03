import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
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
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    let currentStudentId: string | null = null
    if (authToken) {
      const { data: { user } } = await supabase.auth.getUser(authToken)
      if (user) {
        currentStudentId = user.user_metadata?.student_id
      }
    }

    const { data: post, error } = await supabase
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
      const { data: reaction } = await supabase
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
    const { data: comments } = await supabase
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
          student_code
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    // Si hay usuario, obtener sus reacciones a los comentarios
    let commentReactions: Record<string, string> = {}
    if (currentStudentId && comments && comments.length > 0) {
      const commentIds = comments.map(c => c.id)
      const { data: reactions } = await supabase
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

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        userReaction,
        comments: commentsWithReactions
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

// PATCH /api/community/posts/[postId] - Actualizar post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sesion invalida' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id

    // Verificar que el usuario es el autor
    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Publicacion no encontrada' },
        { status: 404 }
      )
    }

    if (existingPost.author_id !== studentId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para editar esta publicacion' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido es requerido' },
        { status: 400 }
      )
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
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
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar publicacion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, post })

  } catch (error) {
    console.error('Error in PATCH /api/community/posts/[postId]:', error)
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
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sesion invalida' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id

    // Verificar que el usuario es el autor o admin
    const { data: student } = await supabase
      .from('students')
      .select('role')
      .eq('id', studentId)
      .single()

    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
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

    const { error } = await supabase
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
