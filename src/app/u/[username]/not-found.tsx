import Link from 'next/link'
import { UserX, ArrowLeft, Sparkles } from 'lucide-react'

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="h-24 w-24 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <UserX className="h-12 w-12 text-slate-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Usuario no encontrado
        </h1>
        <p className="text-slate-400 mb-8">
          Este perfil no existe o no está disponible. El usuario puede no ser afiliado activo de StarEduca.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al inicio
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Convertirme en afiliado
          </Link>
        </div>
      </div>
    </div>
  )
}
