import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
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

    // Obtener comentario y verificar permisos
    const { data: comment } = await supabase
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
    const { data: student } = await supabase
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

    // Eliminar comentario
    const { error } = await supabase
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
    await supabase.rpc('decrement_comments_count', { post_id: comment.post_id })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/community/comments/[commentId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
