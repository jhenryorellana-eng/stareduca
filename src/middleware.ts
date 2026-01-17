import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Solo ejecutar middleware en rutas que lo necesitan (auth check)
     * Esto evita timeouts en Vercel Edge por llamadas innecesarias
     */
    '/dashboard/:path*',
    '/courses/:path*',
    '/community/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/affiliate/:path*',
    '/referrals/:path*',
    '/earnings/:path*',
    '/links/:path*',
    '/payouts/:path*',
    '/login',
    '/register',
    '/register/:path*',
  ],
}
