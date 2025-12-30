import Link from 'next/link'
import { ArrowRight, DollarSign, Users, Link as LinkIcon, TrendingUp } from 'lucide-react'
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
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Registrarse
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Gana dinero compartiendo{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Starbooks
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Únete a nuestro programa de afiliados y gana el{' '}
            <span className="text-indigo-400 font-semibold">80% de comisión</span>{' '}
            por cada suscripción que refieras. Pagos recurrentes cada mes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 border-slate-600 text-slate-300 hover:bg-slate-800">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-indigo-400 mb-2">80%</div>
            <div className="text-slate-400">Comisión</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-green-400 mb-2">$10</div>
            <div className="text-slate-400">Mín. Retiro</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-purple-400 mb-2">30</div>
            <div className="text-slate-400">Días Cookie</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <div className="text-4xl font-bold text-amber-400 mb-2">PayPal</div>
            <div className="text-slate-400">Pagos</div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700">
              <div className="h-14 w-14 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-6">
                <LinkIcon className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Obtén tu link</h3>
              <p className="text-slate-400">
                Regístrate y obtén tu link único de afiliado. Compártelo en redes sociales, blogs o con amigos.
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700">
              <div className="h-14 w-14 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Refiere usuarios</h3>
              <p className="text-slate-400">
                Cuando alguien se suscribe a Starbooks usando tu link, se registra como tu referido.
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700">
              <div className="h-14 w-14 rounded-xl bg-green-600/20 flex items-center justify-center mb-6">
                <DollarSign className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Gana comisiones</h3>
              <p className="text-slate-400">
                Recibe el 80% de cada pago mensual de tus referidos mientras ambos mantengan su suscripción activa.
              </p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-32 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Requisitos
          </h2>
          <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="h-8 w-8 text-indigo-400" />
              <span className="text-xl font-semibold text-white">Suscripción Premium Activa</span>
            </div>
            <p className="text-slate-400 max-w-xl mx-auto">
              Para ser afiliado, necesitas tener una cuenta de Starbooks con suscripción premium activa.
              Mientras mantengas tu suscripción, seguirás ganando comisiones por tus referidos.
            </p>
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
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} StarEduca. Programa de afiliados de Starbooks.
          </p>
        </div>
      </footer>
    </div>
  )
}
