import { NextResponse, type NextRequest } from 'next/server'

// Decodificar JWT sin verificar (la verificación la hacen las páginas)
function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Buscar el cookie de sesión de Supabase
  // El formato es: sb-<project-ref>-auth-token
  const authCookie = request.cookies.getAll().find(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  let user: { id: string } | null = null

  if (authCookie) {
    try {
      // El cookie contiene un JSON con access_token
      const cookieData = JSON.parse(authCookie.value)
      const accessToken = cookieData?.access_token || cookieData?.[0]?.access_token

      if (accessToken) {
        const payload = decodeJwtPayload(accessToken)
        // Verificar que no esté expirado (con 60s de margen)
        if (payload?.sub && payload?.exp && payload.exp > Date.now() / 1000 - 60) {
          user = { id: payload.sub }
        }
      }
    } catch {
      // Cookie inválido o expirado - usuario no autenticado
      user = null
    }
  }

  // Protected routes - require authentication
  const protectedPaths = ['/dashboard', '/courses', '/community', '/settings', '/admin', '/affiliate', '/referrals', '/earnings', '/links', '/payouts']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
