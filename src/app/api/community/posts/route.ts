import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyActiveSubscription } from '@/lib/auth/subscriptionCheck'

// Service client para bypasear RLS
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/community/posts - Lista de posts
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const currentStudentId = student.id

    // Query posts con autor
    const { data: posts, error, count } = await serviceClient
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
      const { data: reactions } = await serviceClient
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
    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    // Procesar FormData
    const formData = await request.formData()
    const content = formData.get('content') as string
    const imageFile = formData.get('image') as File | null

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

    // Subir imagen si existe
    let imageUrl: string | null = null
    if (imageFile && imageFile.size > 0) {
      // Validar tipo de archivo
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'Solo se permiten archivos de imagen' },
          { status: 400 }
        )
      }

      // Validar tamaño (max 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'La imagen no puede superar 5MB' },
          { status: 400 }
        )
      }

      // Generar nombre único para el archivo
      const fileExt = imageFile.name.split('.').pop() || 'jpg'
      const fileName = `${studentId}/${Date.now()}.${fileExt}`

      // Convertir File a ArrayBuffer y luego a Buffer
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Subir a Supabase Storage
      const { error: uploadError } = await serviceClient.storage
        .from('post-images')
        .upload(fileName, buffer, {
          contentType: imageFile.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        return NextResponse.json(
          { success: false, error: 'Error al subir la imagen' },
          { status: 500 }
        )
      }

      // Obtener URL pública
      const { data: publicUrlData } = serviceClient.storage
        .from('post-images')
        .getPublicUrl(fileName)

      imageUrl = publicUrlData.publicUrl
    }

    // Crear post
    const { data: post, error } = await serviceClient
      .from('posts')
      .insert({
        author_id: studentId,
        content: content.trim(),
        image_url: imageUrl
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
      const { data: mentionedStudents } = await serviceClient
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

        await serviceClient.from('mentions').insert(mentionRecords)

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

        await serviceClient.from('notifications').insert(notificationRecords)
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
