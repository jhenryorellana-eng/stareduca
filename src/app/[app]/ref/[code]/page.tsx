import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { Smartphone, Star, BookOpen, Users, Award, Download, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ReferralPageProps {
  params: Promise<{
    app: string
    code: string
  }>
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { app: appSlug, code } = await params

  const supabase = await createClient()

  // 1. Verificar que la app existe
  const { data: app } = await supabase
    .from('apps')
    .select('*')
    .eq('slug', appSlug)
    .eq('is_active', true)
    .single()

  if (!app) {
    notFound()
  }

  // 2. Verificar que el código de referido existe y está activo
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select(`
      id,
      referral_code,
      is_active,
      profile:profiles!affiliates_user_id_fkey(username)
    `)
    .eq('referral_code', code)
    .eq('app_id', app.id)
    .single()

  if (!affiliate || !affiliate.is_active) {
    notFound()
  }

  // 3. Registrar el clic
  await supabase.from('affiliate_link_clicks').insert({
    affiliate_id: affiliate.id,
    referral_code: code,
  })

  // 4. Incrementar contador de clics
  await supabase.rpc('increment_link_clicks', { affiliate_id: affiliate.id })

  // 5. Guardar el código en una cookie (30 días)
  const cookieStore = await cookies()
  cookieStore.set('referral_code', code, {
    maxAge: 30 * 24 * 60 * 60, // 30 días
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  // Features de la app (Starbooks específico)
  const features = [
    {
      icon: BookOpen,
      title: 'Audiolibros Educativos',
      description: '7 secciones completas por libro incluyendo resúmenes, podcasts y mapas mentales.',
    },
    {
      icon: Users,
      title: 'Comunidad de Estudiantes',
      description: 'Conecta con otros estudiantes en círculos de estudio y chats en tiempo real.',
    },
    {
      icon: Award,
      title: 'Certificados Digitales',
      description: 'Obtén certificados al completar los exámenes finales de cada libro.',
    },
    {
      icon: Star,
      title: 'Chatbot con IA',
      description: 'Resuelve tus dudas con nuestro asistente inteligente basado en el contenido.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-white">{app.name}</span>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          {/* Referral Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 rounded-full border border-indigo-500/30 mb-6">
            <span className="text-indigo-400 text-sm">
              Invitado por @{(affiliate.profile as { username: string }[] | null)?.[0]?.username || 'Usuario'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Aprende de los mejores libros de negocios con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {app.name}
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            {app.description || 'La plataforma de audiolibros educativos para jóvenes emprendedores. Aprende mientras haces cualquier actividad.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {app.ios_store_url && (
              <a
                href={app.ios_store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
              >
                <Download className="h-5 w-5" />
                Descargar para iOS
              </a>
            )}
            {app.android_store_url && (
              <a
                href={app.android_store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
              >
                <Download className="h-5 w-5" />
                Descargar para Android
              </a>
            )}
          </div>

          {/* Deep Link */}
          {app.deep_link_scheme && (
            <div className="mb-12">
              <a
                href={`${app.deep_link_scheme}subscribe?ref=${code}`}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
              >
                <Smartphone className="h-4 w-4" />
                Ya tengo la app instalada
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Price */}
          <div className="inline-block bg-slate-800/50 rounded-2xl px-8 py-6 border border-slate-700 mb-12">
            <p className="text-slate-400 mb-2">Suscripción Premium</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">
                ${(app.subscription_price_cents || 700) / 100}
              </span>
              <span className="text-slate-400">/mes</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Cancela cuando quieras
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            ¿Qué incluye {app.name}?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-600/20">
                    <feature.icon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <h3 className="text-xl font-semibold text-white mb-4">
            ¿Listo para empezar tu viaje de aprendizaje?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {app.ios_store_url && (
              <a
                href={app.ios_store_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8">
                  Descargar Ahora
                </Button>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-semibold text-white">{app.name}</span>
          </div>
          <p className="text-slate-500 text-sm text-center">
            © {new Date().getFullYear()} {app.name}. Todos los derechos reservados.
          </p>
          <Link href="/" className="text-slate-400 hover:text-white text-sm">
            Programa de Afiliados
          </Link>
        </div>
      </footer>
    </div>
  )
}

// Generar metadata dinámica
export async function generateMetadata({ params }: ReferralPageProps) {
  const { app: appSlug } = await params

  const supabase = await createClient()
  const { data: app } = await supabase
    .from('apps')
    .select('name, description')
    .eq('slug', appSlug)
    .single()

  return {
    title: app ? `${app.name} - Descarga la App` : 'Starbooks',
    description: app?.description || 'La plataforma de audiolibros educativos para jóvenes emprendedores.',
  }
}
