import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/community/posts/[postId]/comments - Obtener comentarios
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

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        reactions_count,
        parent_comment_id,
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
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al cargar comentarios' },
        { status: 500 }
      )
    }

    // Si hay usuario, obtener sus reacciones
    let userReactions: Record<string, string> = {}
    if (currentStudentId && comments && comments.length > 0) {
      const commentIds = comments.map(c => c.id)
      const { data: reactions } = await supabase
        .from('reactions')
        .select('target_id, type')
        .eq('student_id', currentStudentId)
        .eq('target_type', 'comment')
        .in('target_id', commentIds)

      if (reactions) {
        userReactions = reactions.reduce((acc, r) => {
          acc[r.target_id] = r.type
          return acc
        }, {} as Record<string, string>)
      }
    }

    // Organizar comentarios en arbol (padres e hijos)
    const commentsWithReactions = comments?.map(comment => ({
      ...comment,
      userReaction: userReactions[comment.id] || null
    })) || []

    // Separar comentarios raiz y respuestas
    const rootComments = commentsWithReactions.filter(c => !c.parent_comment_id)
    const replies = commentsWithReactions.filter(c => c.parent_comment_id)

    // Anidar respuestas en comentarios raiz
    const nestedComments = rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_comment_id === comment.id)
    }))

    return NextResponse.json({
      success: true,
      comments: nestedComments
    })

  } catch (error) {
    console.error('Error in GET /api/community/posts/[postId]/comments:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/community/posts/[postId]/comments - Crear comentario
export async function POST(
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
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content, parent_comment_id } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El comentario es requerido' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'El comentario es demasiado largo (max 2000 caracteres)' },
        { status: 400 }
      )
    }

    // Verificar que el post existe
    const { data: post } = await supabase
      .from('posts')
      .select('id, author_id, comments_count')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Publicacion no encontrada' },
        { status: 404 }
      )
    }

    // Crear comentario
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: studentId,
        parent_comment_id: parent_comment_id || null,
        content: content.trim()
      })
      .select(`
        id,
        content,
        reactions_count,
        parent_comment_id,
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
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear comentario' },
        { status: 500 }
      )
    }

    // Incrementar contador de comentarios del post
    await supabase
      .from('posts')
      .update({ comments_count: post.comments_count + 1 })
      .eq('id', postId)

    // Obtener info del comentador para notificaciones
    const { data: commenter } = await supabase
      .from('students')
      .select('full_name')
      .eq('id', studentId)
      .single()

    // Notificar al autor del post (si no es el mismo)
    if (post.author_id !== studentId) {
      await supabase.from('notifications').insert({
        student_id: post.author_id,
        type: 'comment',
        title: 'Nuevo comentario',
        message: `${commenter?.full_name || 'Alguien'} comento en tu publicacion`,
        related_id: postId,
        related_type: 'post',
        action_url: `/community/post/${postId}`
      })
    }

    // Si es respuesta a otro comentario, notificar al autor del comentario padre
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parent_comment_id)
        .single()

      if (parentComment && parentComment.author_id !== studentId && parentComment.author_id !== post.author_id) {
        await supabase.from('notifications').insert({
          student_id: parentComment.author_id,
          type: 'comment',
          title: 'Nueva respuesta',
          message: `${commenter?.full_name || 'Alguien'} respondio a tu comentario`,
          related_id: postId,
          related_type: 'post',
          action_url: `/community/post/${postId}`
        })
      }
    }

    // Procesar menciones (@usuario)
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)

    if (mentions && mentions.length > 0) {
      const studentCodes = mentions.map((m: string) => m.substring(1))

      const { data: mentionedStudents } = await supabase
        .from('students')
        .select('id, student_code')
        .in('student_code', studentCodes)

      if (mentionedStudents && mentionedStudents.length > 0) {
        const mentionRecords = mentionedStudents
          .filter(s => s.id !== studentId) // No mencionar a si mismo
          .map(s => ({
            source_type: 'comment',
            source_id: comment.id,
            mentioned_student_id: s.id,
            mentioned_by_student_id: studentId
          }))

        if (mentionRecords.length > 0) {
          await supabase.from('mentions').insert(mentionRecords)

          const notificationRecords = mentionRecords.map(m => ({
            student_id: m.mentioned_student_id,
            type: 'mention',
            title: 'Nueva mencion',
            message: `Te mencionaron en un comentario`,
            related_id: postId,
            related_type: 'post',
            action_url: `/community/post/${postId}`
          }))

          await supabase.from('notifications').insert(notificationRecords)
        }
      }
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        userReaction: null,
        replies: []
      }
    })

  } catch (error) {
    console.error('Error in POST /api/community/posts/[postId]/comments:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
