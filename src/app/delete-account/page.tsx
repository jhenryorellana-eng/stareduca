import { Metadata } from 'next'
import { Mail, Trash2, Shield, Clock, AlertCircle, CheckCircle2, Database, UserX } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Eliminar Cuenta - Starbooks',
  description: 'Solicita la eliminación de tu cuenta y datos personales de la aplicación Starbooks.',
}

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Starbooks</h1>
              <p className="text-xs text-slate-400">Audiolibros Educativos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-6">
            <UserX className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Solicitud de Eliminación de Cuenta y Datos
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            En Starbooks respetamos tu privacidad. Aquí puedes solicitar la eliminación completa
            de tu cuenta y los datos personales asociados a nuestra aplicación.
          </p>
        </div>

        {/* Steps Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Mail className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Cómo Solicitar la Eliminación</h2>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Envía un correo electrónico</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Escribe a nuestra dirección de soporte con el asunto especificado:
                </p>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-500 mb-1">Para:</p>
                  <p className="text-indigo-400 font-mono mb-3">soporte@starbizacademy.com</p>
                  <p className="text-sm text-slate-500 mb-1">Asunto:</p>
                  <p className="text-white font-mono">Solicitud de Eliminación de Cuenta - Starbooks</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Incluye tu información</h3>
                <p className="text-slate-400 text-sm">
                  En el cuerpo del correo, incluye el <strong className="text-white">correo electrónico</strong> con
                  el que te registraste en la aplicación Starbooks para que podamos identificar tu cuenta.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Verificación de identidad</h3>
                <p className="text-slate-400 text-sm">
                  Por seguridad, te enviaremos un correo de confirmación a la dirección registrada
                  para verificar que eres el titular de la cuenta.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Procesamiento</h3>
                <p className="text-slate-400 text-sm">
                  Una vez verificada tu identidad, procesaremos tu solicitud en un plazo máximo
                  de <strong className="text-white">15 días hábiles</strong>. Recibirás una confirmación
                  cuando la eliminación se haya completado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Deleted Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Trash2 className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Datos que se Eliminan</h2>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <p className="text-slate-400 text-sm mb-4">
              Al procesar tu solicitud, eliminaremos permanentemente los siguientes datos:
            </p>
            <ul className="space-y-3">
              {[
                'Perfil de usuario (nombre, avatar, biografía)',
                'Progreso de lectura y capítulos completados',
                'Notas personales y marcadores',
                'Historial de conversaciones con el asistente IA',
                'Publicaciones y comentarios en comunidades',
                'Reacciones y actividad social',
                'Preferencias de notificación',
                'Certificados obtenidos',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Data Retained Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Database className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Datos que se Conservan</h2>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
            <p className="text-slate-400 text-sm mb-4">
              Por obligaciones legales y de seguridad, algunos datos se conservan temporalmente:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-sm">Registros de transacciones y pagos</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Período de retención: <strong className="text-amber-400">7 años</strong>
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Requerido por normativas fiscales y contables.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <Shield className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-sm">Logs de seguridad anonimizados</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Período de retención: <strong className="text-amber-400">90 días</strong>
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Para prevención de fraude y seguridad de la plataforma. No contienen información personal identificable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="mb-12">
          <div className="bg-red-500/10 rounded-2xl border border-red-500/20 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold mb-2">Importante</h3>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li>• La eliminación de cuenta es <strong className="text-white">permanente e irreversible</strong>.</li>
                  <li>• Perderás acceso a todo el contenido premium y tu suscripción activa.</li>
                  <li>• No podrás recuperar tu progreso, certificados ni historial.</li>
                  <li>• Si tienes una suscripción activa, te recomendamos cancelarla primero desde la configuración de tu dispositivo.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <div className="text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <h3 className="text-white font-semibold mb-2">¿Tienes preguntas?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Si tienes dudas sobre el proceso de eliminación o necesitas ayuda, contáctanos:
            </p>
            <a
              href="mailto:soporte@starbizacademy.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
            >
              <Mail className="h-4 w-4" />
              soporte@starbizacademy.com
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Starbooks - Starbiz Academy. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
