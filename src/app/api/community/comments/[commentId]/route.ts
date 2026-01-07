import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE /api/community/comments/[commentId] - Eliminar comentario
export async function DELETE(
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

    // Obtener comentario y verificar permisos
    const { data: comment } = await serviceClient
      .from('comments')
      .select('id, author_id, post_id')
      .eq('id', commentId)
      .single()

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comentario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que es el autor o admin
    const { data: student } = await serviceClient
      .from('students')
      .select('role')
      .eq('id', studentId)
      .single()

    const isAuthor = comment.author_id === studentId
    const isAdmin = student?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso' },
        { status: 403 }
      )
    }

    // Obtener el post para actualizar el contador
    const { data: post } = await serviceClient
      .from('posts')
      .select('comments_count')
      .eq('id', comment.post_id)
      .single()

    // Eliminar comentario
    const { error } = await serviceClient
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar comentario' },
        { status: 500 }
      )
    }

    // Decrementar contador del post
    if (post) {
      await serviceClient
        .from('posts')
        .update({ comments_count: Math.max(0, post.comments_count - 1) })
        .eq('id', comment.post_id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/community/comments/[commentId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
