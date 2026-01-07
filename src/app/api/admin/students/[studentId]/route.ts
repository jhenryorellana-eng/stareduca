import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente con service role para operaciones admin (bypassa RLS)
const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper para extraer path del storage desde URL
function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
  return match ? match[1] : null
}

// Verificar que el usuario es admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const studentId = user.user_metadata?.student_id
  if (!studentId) return null

  const { data: student } = await serviceClient
    .from('students')
    .select('id, role')
    .eq('id', studentId)
    .single()

  if (!student || student.role !== 'admin') return null
  return student
}

// DELETE /api/admin/students/[studentId] - Eliminar estudiante y todos sus datos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const admin = await verifyAdmin()

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que no es auto-eliminacion
    if (admin.id === studentId) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      )
    }

    // Obtener datos del estudiante
    const { data: student, error: studentError } = await serviceClient
      .from('students')
      .select('id, full_name, email, avatar_url')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Estadisticas de limpieza
    const stats = {
      storageFilesDeleted: 0,
      storageBytesFreed: 0,
    }

    // =========================================================================
    // 1. LIMPIEZA DE STORAGE (antes de eliminar registros de la BD)
    // =========================================================================

    // 1a. Obtener posts del estudiante con imagenes
    const { data: postsWithImages } = await serviceClient
      .from('posts')
      .select('id, image_url')
      .eq('student_id', studentId)
      .not('image_url', 'is', null)

    // 1b. Eliminar imagenes de posts del bucket "post-images"
    if (postsWithImages && postsWithImages.length > 0) {
      for (const post of postsWithImages) {
        const path = extractStoragePath(post.image_url)
        if (path) {
          try {
            const { error } = await serviceClient.storage
              .from('post-images')
              .remove([path])
            if (!error) {
              stats.storageFilesDeleted++
            }
          } catch (e) {
            console.error(`Error deleting post image ${path}:`, e)
          }
        }
      }
    }

    // 1c. Eliminar avatar del bucket "avatars"
    if (student.avatar_url) {
      const avatarPath = extractStoragePath(student.avatar_url)
      if (avatarPath) {
        try {
          const { error } = await serviceClient.storage
            .from('avatars')
            .remove([avatarPath])
          if (!error) {
            stats.storageFilesDeleted++
          }
        } catch (e) {
          console.error(`Error deleting avatar ${avatarPath}:`, e)
        }
      }
    }

    // =========================================================================
    // 2. LIMPIAR REFERENCIAS MANUALES (no tienen ON DELETE CASCADE)
    // =========================================================================

    // 2a. Cursos donde este estudiante era instructor -> SET NULL
    await serviceClient
      .from('courses')
      .update({ instructor_id: null })
      .eq('instructor_id', studentId)

    // 2b. Comisiones de afiliado donde este estudiante fue referido -> SET NULL
    await serviceClient
      .from('affiliate_commissions')
      .update({ referred_student_id: null })
      .eq('referred_student_id', studentId)

    // 2c. Otros estudiantes que fueron referidos por este -> SET NULL
    await serviceClient
      .from('students')
      .update({ referred_by_student_id: null })
      .eq('referred_by_student_id', studentId)

    // =========================================================================
    // 3. ELIMINAR USUARIO DE SUPABASE AUTH
    // =========================================================================

    // Buscar el usuario en auth.users por el student_id en metadata
    // Nota: No podemos buscar directamente por metadata, pero el email generado
    // tiene formato predecible basado en student_code
    const { data: studentData } = await serviceClient
      .from('students')
      .select('generated_email')
      .eq('id', studentId)
      .single()

    if (studentData?.generated_email) {
      try {
        // Listar usuarios y buscar por email
        const { data: { users } } = await serviceClient.auth.admin.listUsers({
          perPage: 1000,
        })

        const authUser = users.find(u => u.email === studentData.generated_email)

        if (authUser) {
          await serviceClient.auth.admin.deleteUser(authUser.id)
        }
      } catch (authError) {
        console.error('Error deleting auth user:', authError)
        // Continuar aunque falle - el estudiante puede no tener usuario auth
      }
    }

    // =========================================================================
    // 4. ELIMINAR REGISTRO DE STUDENTS (CASCADE elimina todo lo demas)
    // =========================================================================
    // Tablas que se eliminan automaticamente por ON DELETE CASCADE:
    // - student_progress
    // - posts (y sus comments/reactions)
    // - comments
    // - reactions
    // - mentions
    // - subscriptions
    // - payments
    // - affiliates (y sus commissions/payouts)
    // - affiliate_link_clicks
    // - notifications
    // - notification_preferences
    // - sso_tokens
    // - password_reset_tokens

    const { error: deleteError } = await serviceClient
      .from('students')
      .delete()
      .eq('id', studentId)

    if (deleteError) {
      console.error('Error deleting student:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar estudiante' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Estudiante ${student.full_name} eliminado correctamente`,
      stats,
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/students/[studentId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
