import { NextResponse, type NextRequest } from 'next/server'

function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return payload
  } catch {
    return null
  }
}

export function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log(`[PROXY] Processing: ${pathname}`)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Buscar el cookie de sesión de Supabase
  const allCookies = request.cookies.getAll()
  console.log(`[PROXY] Cookies encontradas: ${allCookies.map(c => c.name).join(', ') || 'ninguna'}`)

  const authCookie = allCookies.find(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  let user: { id: string } | null = null

  if (authCookie) {
    console.log(`[PROXY] Cookie de auth encontrado: ${authCookie.name}`)
    try {
      let cookieValue = authCookie.value

      // Supabase SSR usa formato "base64-{json_en_base64}"
      if (cookieValue.startsWith('base64-')) {
        const base64Data = cookieValue.slice(7)
        cookieValue = Buffer.from(base64Data, 'base64').toString('utf-8')
        console.log(`[PROXY] Cookie decodificado de base64`)
      }

      const cookieData = JSON.parse(cookieValue)
      const accessToken = cookieData?.access_token || cookieData?.[0]?.access_token

      if (accessToken) {
        const payload = decodeJwtPayload(accessToken)
        if (payload?.sub && payload?.exp && payload.exp > Date.now() / 1000 - 60) {
          user = { id: payload.sub }
          console.log(`[PROXY] Usuario autenticado: ${user.id}`)
        } else {
          console.log(`[PROXY] Token expirado o inválido`)
        }
      }
    } catch (e) {
      console.log(`[PROXY] Error parseando cookie: ${e}`)
      user = null
    }
  } else {
    console.log(`[PROXY] No se encontró cookie de auth`)
  }

  // Protected routes
  const protectedPaths = ['/dashboard', '/courses', '/community', '/settings', '/admin', '/affiliate', '/referrals', '/earnings', '/links', '/payouts']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !user) {
    console.log(`[PROXY] Ruta protegida sin auth -> Redirigiendo a /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  if (isAuthPath && user) {
    console.log(`[PROXY] Usuario autenticado en página de auth -> Redirigiendo a /dashboard`)
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  console.log(`[PROXY] Pasando al siguiente handler`)
  return response
}
