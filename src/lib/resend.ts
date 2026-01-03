// ============================================================================
// RESEND EMAIL CLIENT
// Emails transaccionales para StarEduca (starbizacademy.com)
// ============================================================================

import { Resend } from 'resend'

// Inicializar cliente de Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Configuración del remitente
const FROM_EMAIL = 'StarEduca <noreply@starbizacademy.com>'
const FROM_EMAIL_DEV = 'StarEduca <onboarding@resend.dev>' // Para desarrollo

function getFromEmail() {
  // En desarrollo, usar el email de prueba de Resend
  if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY?.startsWith('re_')) {
    return FROM_EMAIL_DEV
  }
  return FROM_EMAIL
}

// ============================================================================
// TEMPLATES
// ============================================================================

interface WelcomeEmailData {
  fullName: string
  studentCode: string
  generatedEmail: string
}

function getWelcomeEmailHtml(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a StarEduca</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <div style="display: inline-flex; align-items: center; gap: 10px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-weight: bold; font-size: 24px;">S</span>
                </div>
                <span style="color: white; font-size: 28px; font-weight: bold;">StarEduca</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B, #334155); border-radius: 16px; padding: 40px;">

              <!-- Welcome Message -->
              <h1 style="color: #F8FAFC; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                ¡Bienvenido a StarEduca!
              </h1>

              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Hola <strong style="color: #F8FAFC;">${data.fullName}</strong>, tu cuenta ha sido creada exitosamente. Ya puedes acceder a todos los cursos y la comunidad.
              </p>

              <!-- Student Code Box -->
              <div style="background: #0F172A; border: 2px solid #6366F1; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">Tu Codigo de Estudiante</p>
                <p style="color: #818CF8; font-size: 32px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 2px;">
                  ${data.studentCode}
                </p>
              </div>

              <!-- Email Box -->
              <div style="background: #0F172A; border: 1px solid #475569; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">Tu Email de Acceso</p>
                <p style="color: #10B981; font-size: 18px; font-family: monospace; margin: 0;">
                  ${data.generatedEmail}
                </p>
              </div>

              <!-- Info -->
              <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #818CF8; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
                  ¿Que incluye tu suscripcion?
                </p>
                <ul style="color: #94A3B8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Acceso a todos los cursos y materiales</li>
                  <li>Videos exclusivos y contenido descargable</li>
                  <li>Comunidad de emprendedores</li>
                  <li>Soporte personalizado</li>
                  <li>Certificados de completacion</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="https://stareduca.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ir a mi Dashboard
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #64748B; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} StarEduca. Todos los derechos reservados.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 10px 0 0 0;">
                Este email fue enviado porque completaste tu registro en StarEduca.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// ============================================================================
// EMAIL DE CONFIRMACION DE PAGO
// ============================================================================

interface PaymentConfirmationEmailData {
  fullName: string
  amount: number
  currency: string
  plan: 'monthly' | 'yearly'
  paymentMethod: string
}

function getPaymentConfirmationEmailHtml(data: PaymentConfirmationEmailData): string {
  const planName = data.plan === 'monthly' ? 'Mensual' : 'Anual'
  const symbol = data.currency === 'PEN' ? 'S/' : '$'
  const formattedAmount = `${symbol}${data.amount.toFixed(2)}`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago Confirmado - StarEduca</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <div style="display: inline-flex; align-items: center; gap: 10px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-weight: bold; font-size: 24px;">S</span>
                </div>
                <span style="color: white; font-size: 28px; font-weight: bold;">StarEduca</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B, #334155); border-radius: 16px; padding: 40px;">

              <!-- Success Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); line-height: 64px;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </div>

              <!-- Welcome Message -->
              <h1 style="color: #10B981; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                ¡Pago Recibido Exitosamente!
              </h1>

              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Hola <strong style="color: #F8FAFC;">${data.fullName}</strong>, hemos recibido tu pago correctamente.
              </p>

              <!-- Payment Details Box -->
              <div style="background: #0F172A; border: 2px solid #10B981; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Monto pagado:</td>
                    <td style="color: #10B981; font-size: 20px; font-weight: bold; text-align: right;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Plan:</td>
                    <td style="color: #F8FAFC; font-size: 16px; text-align: right;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Metodo de pago:</td>
                    <td style="color: #F8FAFC; font-size: 16px; text-align: right;">${data.paymentMethod}</td>
                  </tr>
                </table>
              </div>

              <!-- Next Step -->
              <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="color: #818CF8; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                  Siguiente paso
                </p>
                <p style="color: #94A3B8; font-size: 14px; margin: 0;">
                  Crea tu contrasena para acceder a la plataforma. Si ya lo hiciste, este paso esta completado.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="https://stareduca.ai/register/complete" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Completar mi Registro
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #64748B; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} StarEduca. Todos los derechos reservados.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 10px 0 0 0;">
                Este email fue enviado porque realizaste un pago en StarEduca.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function sendPaymentConfirmationEmail(params: {
  to: string
  fullName: string
  amount: number
  currency: string
  plan: 'monthly' | 'yearly'
  paymentMethod: string
}) {
  const { to, fullName, amount, currency, plan, paymentMethod } = params
  const symbol = currency === 'PEN' ? 'S/' : '$'
  const formattedAmount = `${symbol}${amount.toFixed(2)}`

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `Pago confirmado: ${formattedAmount} - StarEduca`,
      html: getPaymentConfirmationEmailHtml({
        fullName,
        amount,
        currency,
        plan,
        paymentMethod,
      }),
    })

    if (error) {
      console.error('Error sending payment confirmation email:', error)
      throw error
    }

    console.log('Payment confirmation email sent:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Failed to send payment confirmation email:', error)
    throw error
  }
}

// ============================================================================
// EMAIL DE BIENVENIDA (NUEVO ESTUDIANTE)
// ============================================================================

export async function sendWelcomeEmail(params: {
  to: string
  fullName: string
  studentCode: string
  generatedEmail: string
}) {
  const { to, fullName, studentCode, generatedEmail } = params

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `¡Bienvenido a StarEduca! Tu codigo: ${studentCode}`,
      html: getWelcomeEmailHtml({
        fullName,
        studentCode,
        generatedEmail,
      }),
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      throw error
    }

    console.log('Welcome email sent:', data?.id)
    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Failed to send welcome email:', error)
    throw error
  }
}

// ============================================================================
// EMAIL DE NUEVA COMISION (AFILIADOS)
// ============================================================================

export async function sendCommissionEmail(params: {
  to: string
  fullName: string
  amount: number
  referredName: string
  currency: string
}) {
  const { to, fullName, amount, referredName, currency } = params
  const formattedAmount = currency === 'USD' ? `$${amount.toFixed(2)}` : `S/${amount.toFixed(2)}`

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `¡Nueva comision de ${formattedAmount}!`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B, #334155); border-radius: 16px; padding: 40px;">
              <h1 style="color: #10B981; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                ¡Nueva Comision!
              </h1>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Hola <strong style="color: #F8FAFC;">${fullName}</strong>, has ganado una nueva comision.
              </p>
              <div style="background: #0F172A; border: 2px solid #10B981; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">Monto de la comision</p>
                <p style="color: #10B981; font-size: 36px; font-weight: bold; margin: 0;">
                  ${formattedAmount}
                </p>
              </div>
              <p style="color: #94A3B8; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                Gracias a la suscripcion de <strong style="color: #F8FAFC;">${referredName}</strong>
              </p>
              <div style="text-align: center;">
                <a href="https://stareduca.ai/affiliate" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver mis ganancias
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending commission email:', error)
      return { success: false, error }
    }

    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Failed to send commission email:', error)
    return { success: false, error }
  }
}

// ============================================================================
// EMAIL DE PAGO PROCESADO (RETIRO)
// ============================================================================

export async function sendPayoutEmail(params: {
  to: string
  fullName: string
  amount: number
  currency: string
  status: 'completed' | 'failed'
}) {
  const { to, fullName, amount, currency, status } = params
  const formattedAmount = currency === 'USD' ? `$${amount.toFixed(2)}` : `S/${amount.toFixed(2)}`

  const subject = status === 'completed'
    ? `¡Tu pago de ${formattedAmount} ha sido enviado!`
    : `Problema con tu pago de ${formattedAmount}`

  const title = status === 'completed' ? '¡Pago Enviado!' : 'Problema con el Pago'
  const color = status === 'completed' ? '#10B981' : '#EF4444'
  const message = status === 'completed'
    ? `Tu pago de <strong>${formattedAmount}</strong> ha sido enviado a tu cuenta.`
    : `Hubo un problema al procesar tu pago de <strong>${formattedAmount}</strong>. Por favor contacta a soporte.`

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B, #334155); border-radius: 16px; padding: 40px;">
              <h1 style="color: ${color}; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                ${title}
              </h1>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Hola ${fullName},
              </p>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                ${message}
              </p>
              <div style="text-align: center;">
                <a href="https://stareduca.ai/affiliate/payouts" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ver mis pagos
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending payout email:', error)
      return { success: false, error }
    }

    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Failed to send payout email:', error)
    return { success: false, error }
  }
}

// ============================================================================
// EMAIL DE RENOVACION PROXIMA
// ============================================================================

export async function sendRenewalReminderEmail(params: {
  to: string
  fullName: string
  renewalDate: string
  plan: 'monthly' | 'yearly'
}) {
  const { to, fullName, renewalDate, plan } = params
  const planName = plan === 'monthly' ? 'mensual' : 'anual'

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `Tu suscripcion ${planName} se renovara pronto`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B, #334155); border-radius: 16px; padding: 40px;">
              <h1 style="color: #F8FAFC; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                Recordatorio de Renovacion
              </h1>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Hola <strong style="color: #F8FAFC;">${fullName}</strong>,
              </p>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Tu suscripcion <strong style="color: #818CF8;">${planName}</strong> se renovara automaticamente el <strong style="color: #F8FAFC;">${renewalDate}</strong>.
              </p>
              <p style="color: #64748B; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                Si deseas cancelar o cambiar tu plan, puedes hacerlo desde tu dashboard.
              </p>
              <div style="text-align: center;">
                <a href="https://stareduca.ai/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Administrar suscripcion
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending renewal reminder email:', error)
      return { success: false, error }
    }

    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Failed to send renewal reminder email:', error)
    return { success: false, error }
  }
}

// ============================================================================
// EMAIL DE SUSCRIPCION CANCELADA
// ============================================================================

export async function sendSubscriptionCanceledEmail(params: {
  to: string
  fullName: string
  endDate: string
}) {
  const { to, fullName, endDate } = params

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: 'Tu suscripcion ha sido cancelada',
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B, #334155); border-radius: 16px; padding: 40px;">
              <h1 style="color: #F8FAFC; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                Suscripcion Cancelada
              </h1>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Hola <strong style="color: #F8FAFC;">${fullName}</strong>,
              </p>
              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Tu suscripcion ha sido cancelada. Aun tendras acceso hasta el <strong style="color: #F8FAFC;">${endDate}</strong>.
              </p>
              <p style="color: #64748B; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                Esperamos verte pronto. Si cambias de opinion, puedes reactivar tu suscripcion en cualquier momento.
              </p>
              <div style="text-align: center;">
                <a href="https://stareduca.ai/register" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Reactivar suscripcion
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending subscription canceled email:', error)
      return { success: false, error }
    }

    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Failed to send subscription canceled email:', error)
    return { success: false, error }
  }
}
