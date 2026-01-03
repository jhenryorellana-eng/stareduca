import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_REACTIONS = ['like', 'love', 'celebrate', 'insightful', 'curious']

// POST /api/community/comments/[commentId]/reactions - Agregar/cambiar reaccion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
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
    const { type } = body

    if (!type || !VALID_REACTIONS.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de reaccion invalido' },
        { status: 400 }
      )
    }

    // Verificar que el comentario existe
    const { data: comment } = await supabase
      .from('comments')
      .select('id, author_id, reactions_count, post_id')
      .eq('id', commentId)
      .single()

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comentario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe una reaccion
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id, type')
      .eq('student_id', studentId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .single()

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Misma reaccion: eliminar (toggle off)
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)

        await supabase
          .from('comments')
          .update({ reactions_count: Math.max(0, comment.reactions_count - 1) })
          .eq('id', commentId)

        return NextResponse.json({
          success: true,
          reaction: null,
          reactions_count: Math.max(0, comment.reactions_count - 1)
        })
      } else {
        // Diferente reaccion: actualizar
        await supabase
          .from('reactions')
          .update({ type })
          .eq('id', existingReaction.id)

        return NextResponse.json({
          success: true,
          reaction: type,
          reactions_count: comment.reactions_count
        })
      }
    }

    // Nueva reaccion
    await supabase.from('reactions').insert({
      student_id: studentId,
      target_type: 'comment',
      target_id: commentId,
      type
    })

    const newCount = comment.reactions_count + 1
    await supabase
      .from('comments')
      .update({ reactions_count: newCount })
      .eq('id', commentId)

    // Notificar al autor del comentario (si no es el mismo)
    if (comment.author_id !== studentId) {
      const { data: reactor } = await supabase
        .from('students')
        .select('full_name')
        .eq('id', studentId)
        .single()

      await supabase.from('notifications').insert({
        student_id: comment.author_id,
        type: 'reaction',
        title: 'Nueva reaccion',
        message: `${reactor?.full_name || 'Alguien'} reacciono a tu comentario`,
        related_id: comment.post_id,
        related_type: 'post',
        action_url: `/community/post/${comment.post_id}`
      })
    }

    return NextResponse.json({
      success: true,
      reaction: type,
      reactions_count: newCount
    })

  } catch (error) {
    console.error('Error in POST /api/community/comments/[commentId]/reactions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
