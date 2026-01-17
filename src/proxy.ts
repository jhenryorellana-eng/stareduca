import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
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
