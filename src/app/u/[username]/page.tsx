import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  Calendar,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { APP_URL } from '@/lib/constants'
import { CopyButton } from './copy-button'

interface Props {
  params: Promise<{ username: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('username', cleanUsername)
    .single()

  if (!profile) {
    return {
      title: 'Usuario no encontrado | StarEduca',
    }
  }

  return {
    title: `@${profile.username} | StarEduca`,
    description: `Únete a Starbooks con el código de referido de @${profile.username} y accede a contenido exclusivo de educación para emprendedores.`,
    openGraph: {
      title: `@${profile.username} | StarEduca`,
      description: `Únete a Starbooks con el código de referido de @${profile.username}`,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  // Handle both /username and /@username formats
  const cleanUsername = username.startsWith('@') || username.startsWith('%40')
    ? username.replace('@', '').replace('%40', '')
    : username

  const supabase = await createClient()

  // Get profile with affiliate data
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      created_at
    `)
    .eq('username', cleanUsername)
    .single()

  if (!profile) {
    notFound()
  }

  // Get affiliate info
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select(`
      id,
      student_code,
      referral_code,
      is_active,
      created_at,
      app:apps!affiliates_app_id_fkey(name, slug)
    `)
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .single()

  if (!affiliate) {
    notFound()
  }

  // Get referral stats (only converted referrals count)
  const { count: totalReferrals } = await supabase
    .from('affiliate_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'converted')

  const referralLink = `${APP_URL}/${(affiliate.app as { name: string; slug: string }[] | null)?.[0]?.slug || 'starbooks'}/ref/${affiliate.referral_code}`
  const memberSince = new Date(affiliate.created_at).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">StarEduca</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />

          {/* Profile info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-16 mb-4">
              <div className="h-32 w-32 rounded-2xl bg-slate-700 border-4 border-slate-800 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-slate-400">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name & Username */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-1">
                @{profile.username}
              </h1>
              <p className="text-slate-400">
                Afiliado de {(affiliate.app as { name: string; slug: string }[] | null)?.[0]?.name || 'Starbooks'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Referidos</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalReferrals || 0}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Miembro desde</span>
                </div>
                <p className="text-lg font-semibold text-white capitalize">{memberSince}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Estado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-lg font-semibold text-green-400">Activo</p>
                </div>
              </div>
            </div>

            {/* Student Code */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/30 mb-6">
              <p className="text-sm text-slate-400 mb-2">Código de estudiante</p>
              <p className="text-3xl font-mono font-bold text-indigo-400">
                {affiliate.student_code}
              </p>
            </div>

            {/* Referral Link */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-300 mb-3">
                <Link2 className="h-5 w-5" />
                <span className="font-medium">Link de referido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
                  <p className="text-sm text-indigo-400 font-mono truncate">
                    {referralLink}
                  </p>
                </div>
                <CopyButton text={referralLink} />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              ¿Quieres aprender de los mejores libros de negocios?
            </h2>
            <p className="text-indigo-100 mb-6">
              Únete a Starbooks con el código de @{profile.username} y accede a audiolibros exclusivos por solo $7/mes
            </p>
            <a
              href={referralLink}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Unirme ahora
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>
            StarEduca es el programa de afiliados de{' '}
            <a href="https://starbooks.app" className="text-indigo-400 hover:underline">
              Starbooks
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
