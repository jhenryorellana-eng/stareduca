import Link from 'next/link'
import { ArrowRight, BookOpen, Users, Award, PlayCircle, MessageCircle, Star, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-white">StarEduca</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-purple-600/20">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Comenzar Ahora
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-medium">Plataforma Educativa para Emprendedores</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Aprende las habilidades que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              transformarán tu negocio
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Accede a cursos exclusivos, videos de expertos y una comunidad de emprendedores
            que te ayudarán a llevar tu negocio al siguiente nivel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8">
                Comenzar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#cursos">
              <Button size="lg" variant="outline" className="text-lg px-8 border-slate-700 text-slate-300 bg-transparent hover:bg-purple-600 hover:border-purple-600 hover:text-white">
                Ver Cursos
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-indigo-400 mb-2">50+</div>
            <div className="text-slate-400">Cursos</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
            <div className="text-slate-400">Lecciones</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-purple-400 mb-2">10K+</div>
            <div className="text-slate-400">Estudiantes</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-amber-400 mb-2">4.9</div>
            <div className="text-slate-400">Calificación</div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 max-w-6xl mx-auto" id="cursos">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Todo lo que necesitas para crecer
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Una plataforma completa con herramientas diseñadas para tu éxito empresarial
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700 hover:border-indigo-500/50 transition-colors">
              <div className="h-14 w-14 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-6">
                <PlayCircle className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Videos Exclusivos</h3>
              <p className="text-slate-400">
                Aprende de expertos con contenido en video de alta calidad.
                Cada lección diseñada para aplicar inmediatamente.
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700 hover:border-purple-500/50 transition-colors">
              <div className="h-14 w-14 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6">
                <BookOpen className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Cursos Completos</h3>
              <p className="text-slate-400">
                Programas estructurados que te llevan desde lo básico hasta
                dominar cada tema de negocios.
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700 hover:border-green-500/50 transition-colors">
              <div className="h-14 w-14 rounded-xl bg-green-600/20 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Comunidad Activa</h3>
              <p className="text-slate-400">
                Conecta con otros emprendedores, comparte experiencias y
                crece junto a una red de apoyo.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-32 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Impulsa tu carrera como emprendedor
              </h2>
              <p className="text-slate-400 mb-8">
                StarEduca te brinda las herramientas y conocimientos que necesitas
                para destacar en el mundo de los negocios.
              </p>

              <ul className="space-y-4">
                {[
                  'Acceso ilimitado a todos los cursos',
                  'Certificados de finalización',
                  'Material descargable',
                  'Soporte personalizado',
                  'Actualizaciones constantes',
                  'Comunidad exclusiva de emprendedores',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-8 border border-slate-700">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-1 mb-4">
                  <span className="text-green-400 text-sm font-medium">Oferta Especial</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Plan Premium</h3>
                <p className="text-slate-400 mb-6">Acceso completo a toda la plataforma</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$14.99</span>
                  <span className="text-slate-400">/mes</span>
                </div>

                <Link href="/register">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <p className="text-sm text-slate-500 mt-4">
                  Cancela cuando quieras. Sin compromisos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials placeholder */}
        <div className="mt-32 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Lo que dicen nuestros estudiantes
          </h2>
          <p className="text-slate-400 mb-12">
            Miles de emprendedores ya están transformando sus negocios
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'María García',
                role: 'Emprendedora Digital',
                text: 'Los cursos son increíbles. Aprendí más en un mes que en años de intentarlo sola.',
              },
              {
                name: 'Carlos Mendoza',
                role: 'Fundador de Startup',
                text: 'La comunidad es lo mejor. Siempre hay alguien dispuesto a ayudar y compartir.',
              },
              {
                name: 'Ana Torres',
                role: 'Consultora de Negocios',
                text: 'Contenido de primera calidad. Vale cada centavo de la suscripción.',
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 text-left">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div>
                  <p className="text-white font-medium">{testimonial.name}</p>
                  <p className="text-slate-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12">
            <MessageCircle className="h-12 w-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para empezar tu transformación?
            </h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Únete a miles de emprendedores que ya están aprendiendo y creciendo con StarEduca.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 text-lg px-8">
                Crear mi Cuenta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-lg font-semibold text-white">StarEduca</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/terms" className="hover:text-white transition-colors">
              Términos de Servicio
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacidad
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contacto
            </Link>
          </div>

          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} StarEduca. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
