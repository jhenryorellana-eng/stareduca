import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
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

    const body = await request.json()
    const { type } = body

    if (!type || !VALID_REACTIONS.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de reaccion invalido' },
        { status: 400 }
      )
    }

    // Verificar que el comentario existe
    const { data: comment } = await serviceClient
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
    const { data: existingReaction } = await serviceClient
      .from('reactions')
      .select('id, type')
      .eq('student_id', studentId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .single()

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Misma reaccion: eliminar (toggle off)
        await serviceClient
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)

        await serviceClient
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
        await serviceClient
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
    await serviceClient.from('reactions').insert({
      student_id: studentId,
      target_type: 'comment',
      target_id: commentId,
      type
    })

    const newCount = comment.reactions_count + 1
    await serviceClient
      .from('comments')
      .update({ reactions_count: newCount })
      .eq('id', commentId)

    // Notificar al autor del comentario (si no es el mismo)
    if (comment.author_id !== studentId) {
      const { data: reactor } = await serviceClient
        .from('students')
        .select('full_name')
        .eq('id', studentId)
        .single()

      await serviceClient.from('notifications').insert({
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

// GET /api/community/comments/[commentId]/reactions - Obtener todas las reacciones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params

    const { data: reactions, error } = await serviceClient
      .from('reactions')
      .select(`
        id,
        type,
        created_at,
        student:students!student_id (
          id,
          full_name,
          avatar_url,
          student_code
        )
      `)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al cargar reacciones' },
        { status: 500 }
      )
    }

    // Agrupar por tipo
    const grouped = reactions?.reduce((acc, r) => {
      if (!acc[r.type]) {
        acc[r.type] = []
      }
      acc[r.type].push(r.student)
      return acc
    }, {} as Record<string, any[]>) || {}

    return NextResponse.json({
      success: true,
      reactions: grouped,
      total: reactions?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/community/comments/[commentId]/reactions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
