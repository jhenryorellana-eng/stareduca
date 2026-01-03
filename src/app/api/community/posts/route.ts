import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/community/posts - Lista de posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Obtener posts con autor y reacciones del usuario actual
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    let currentStudentId: string | null = null

    if (authToken) {
      const { data: { user } } = await supabase.auth.getUser(authToken)
      if (user) {
        currentStudentId = user.user_metadata?.student_id
      }
    }

    // Query posts con autor
    const { data: posts, error, count } = await supabase
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
      `, { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar publicaciones' },
        { status: 500 }
      )
    }

    // Si hay usuario autenticado, obtener sus reacciones a estos posts
    let userReactions: Record<string, string> = {}
    if (currentStudentId && posts && posts.length > 0) {
      const postIds = posts.map(p => p.id)
      const { data: reactions } = await supabase
        .from('reactions')
        .select('target_id, type')
        .eq('student_id', currentStudentId)
        .eq('target_type', 'post')
        .in('target_id', postIds)

      if (reactions) {
        userReactions = reactions.reduce((acc, r) => {
          acc[r.target_id] = r.type
          return acc
        }, {} as Record<string, string>)
      }
    }

    // Agregar reaccion del usuario a cada post
    const postsWithUserReaction = posts?.map(post => ({
      ...post,
      userReaction: userReactions[post.id] || null
    }))

    return NextResponse.json({
      success: true,
      posts: postsWithUserReaction || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/community/posts:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/community/posts - Crear nuevo post
export async function POST(request: NextRequest) {
  try {
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
    const { content, image_url } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido es requerido' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { success: false, error: 'El contenido es demasiado largo (max 10000 caracteres)' },
        { status: 400 }
      )
    }

    // Crear post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: studentId,
        content: content.trim(),
        image_url: image_url || null
      })
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
      console.error('Error creating post:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear publicacion' },
        { status: 500 }
      )
    }

    // Procesar menciones (@usuario)
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)

    if (mentions && mentions.length > 0) {
      const studentCodes = mentions.map((m: string) => m.substring(1))

      // Buscar estudiantes mencionados
      const { data: mentionedStudents } = await supabase
        .from('students')
        .select('id, student_code')
        .in('student_code', studentCodes)

      if (mentionedStudents && mentionedStudents.length > 0) {
        // Crear registros de menciones
        const mentionRecords = mentionedStudents.map(s => ({
          source_type: 'post',
          source_id: post.id,
          mentioned_student_id: s.id,
          mentioned_by_student_id: studentId
        }))

        await supabase.from('mentions').insert(mentionRecords)

        // Crear notificaciones
        const notificationRecords = mentionedStudents.map(s => ({
          student_id: s.id,
          type: 'mention',
          title: 'Nueva mencion',
          message: `Te mencionaron en una publicacion`,
          related_id: post.id,
          related_type: 'post',
          action_url: `/community/post/${post.id}`
        }))

        await supabase.from('notifications').insert(notificationRecords)
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        userReaction: null
      }
    })

  } catch (error) {
    console.error('Error in POST /api/community/posts:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
