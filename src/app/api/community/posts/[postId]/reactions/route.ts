import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_REACTIONS = ['like', 'love', 'celebrate', 'insightful', 'curious']

// POST /api/community/posts/[postId]/reactions - Agregar/cambiar reaccion
export async function POST(
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

    const body = await request.json()
    const { type } = body

    if (!type || !VALID_REACTIONS.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de reaccion invalido' },
        { status: 400 }
      )
    }

    // Verificar que el post existe
    const { data: post } = await serviceClient
      .from('posts')
      .select('id, author_id, reactions_count')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Publicacion no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si ya existe una reaccion
    const { data: existingReaction } = await serviceClient
      .from('reactions')
      .select('id, type')
      .eq('student_id', studentId)
      .eq('target_type', 'post')
      .eq('target_id', postId)
      .single()

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Misma reaccion: eliminar (toggle off)
        await serviceClient
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)

        // Decrementar contador
        await serviceClient
          .from('posts')
          .update({ reactions_count: Math.max(0, post.reactions_count - 1) })
          .eq('id', postId)

        return NextResponse.json({
          success: true,
          reaction: null,
          reactions_count: Math.max(0, post.reactions_count - 1)
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
          reactions_count: post.reactions_count
        })
      }
    }

    // Nueva reaccion
    await serviceClient.from('reactions').insert({
      student_id: studentId,
      target_type: 'post',
      target_id: postId,
      type
    })

    // Incrementar contador
    const newCount = post.reactions_count + 1
    await serviceClient
      .from('posts')
      .update({ reactions_count: newCount })
      .eq('id', postId)

    // Crear notificacion para el autor (si no es el mismo usuario)
    if (post.author_id !== studentId) {
      const { data: reactor } = await serviceClient
        .from('students')
        .select('full_name')
        .eq('id', studentId)
        .single()

      await serviceClient.from('notifications').insert({
        student_id: post.author_id,
        type: 'reaction',
        title: 'Nueva reaccion',
        message: `${reactor?.full_name || 'Alguien'} reacciono a tu publicacion`,
        related_id: postId,
        related_type: 'post',
        action_url: `/community/post/${postId}`
      })
    }

    return NextResponse.json({
      success: true,
      reaction: type,
      reactions_count: newCount
    })

  } catch (error) {
    console.error('Error in POST /api/community/posts/[postId]/reactions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/community/posts/[postId]/reactions - Obtener todas las reacciones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

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
      .eq('target_type', 'post')
      .eq('target_id', postId)
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
    console.error('Error in GET /api/community/posts/[postId]/reactions:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
