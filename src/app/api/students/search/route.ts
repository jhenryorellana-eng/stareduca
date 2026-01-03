import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/students/search - Buscar estudiantes (para menciones)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        students: []
      })
    }

    // Buscar por nombre o codigo de estudiante
    const { data: students, error } = await supabase
      .from('students')
      .select('id, full_name, student_code, avatar_url')
      .or(`full_name.ilike.%${query}%,student_code.ilike.%${query}%`)
      .eq('subscription_status', 'active')
      .limit(limit)

    if (error) {
      console.error('Error searching students:', error)
      return NextResponse.json(
        { success: false, error: 'Error al buscar estudiantes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      students: students || []
    })

  } catch (error) {
    console.error('Error in GET /api/students/search:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
