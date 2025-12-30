// ============================================================================
// RESEND EMAIL CLIENT
// ============================================================================

import { Resend } from 'resend'

// Inicializar cliente de Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Configuración del remitente
const FROM_EMAIL = 'StarEduca <noreply@stareduca.ai>'
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
  username: string
  studentCode: string
  referralCode: string
  appName: string
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
                ¡Bienvenido al Programa de Afiliados!
              </h1>

              <p style="color: #94A3B8; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Hola <strong style="color: #F8FAFC;">@${data.username}</strong>, ahora eres parte de nuestro programa de afiliados de <strong style="color: #818CF8;">${data.appName}</strong>.
              </p>

              <!-- Student Code Box -->
              <div style="background: #0F172A; border: 2px solid #6366F1; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">Tu Código de Estudiante</p>
                <p style="color: #818CF8; font-size: 32px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 2px;">
                  ${data.studentCode}
                </p>
              </div>

              <!-- Referral Link Box -->
              <div style="background: #0F172A; border: 1px solid #475569; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #94A3B8; font-size: 14px; margin: 0 0 8px 0;">Tu Link de Referido</p>
                <p style="color: #10B981; font-size: 14px; font-family: monospace; margin: 0; word-break: break-all;">
                  https://stareduca.ai/starbooks/ref/${data.referralCode}
                </p>
              </div>

              <!-- Info -->
              <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #818CF8; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
                  ¿Cómo funciona?
                </p>
                <ul style="color: #94A3B8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Comparte tu link con amigos y seguidores</li>
                  <li>Cuando alguien se suscribe usando tu link, ganas <strong style="color: #10B981;">80% de comisión</strong></li>
                  <li>Las comisiones son <strong style="color: #10B981;">recurrentes</strong> mientras el usuario siga pagando</li>
                  <li>Solicita pagos vía PayPal cuando alcances $10 USD</li>
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
                Este email fue enviado porque te registraste en nuestro programa de afiliados.
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
// EMAIL FUNCTIONS
// ============================================================================

export async function sendWelcomeEmail(params: {
  to: string
  username: string
  studentCode: string
  referralCode: string
  appName?: string
}) {
  const { to, username, studentCode, referralCode, appName = 'Starbooks' } = params

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `¡Bienvenido a StarEduca! Tu código: ${studentCode}`,
      html: getWelcomeEmailHtml({
        username,
        studentCode,
        referralCode,
        appName,
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

// Enviar email de nueva comisión
export async function sendCommissionEmail(params: {
  to: string
  username: string
  amount: number
  referredUsername: string
}) {
  const { to, username, amount, referredUsername } = params

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `¡Nueva comisión de $${amount.toFixed(2)}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10B981;">¡Felicidades ${username}!</h1>
          <p>Has ganado una nueva comisión de <strong>$${amount.toFixed(2)} USD</strong></p>
          <p>Gracias a la suscripción de <strong>@${referredUsername}</strong></p>
          <a href="https://stareduca.ai/dashboard/earnings" style="display: inline-block; background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Ver mis ganancias
          </a>
        </div>
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

// Enviar email de pago procesado
export async function sendPayoutEmail(params: {
  to: string
  username: string
  amount: number
  status: 'completed' | 'failed'
}) {
  const { to, username, amount, status } = params

  const subject = status === 'completed'
    ? `¡Tu pago de $${amount.toFixed(2)} ha sido enviado!`
    : `Problema con tu pago de $${amount.toFixed(2)}`

  const message = status === 'completed'
    ? `Tu pago de <strong>$${amount.toFixed(2)} USD</strong> ha sido enviado a tu cuenta de PayPal.`
    : `Hubo un problema al procesar tu pago de <strong>$${amount.toFixed(2)} USD</strong>. Por favor verifica tu email de PayPal.`

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: ${status === 'completed' ? '#10B981' : '#EF4444'};">
            ${status === 'completed' ? '¡Pago Enviado!' : 'Problema con el Pago'}
          </h1>
          <p>Hola ${username},</p>
          <p>${message}</p>
          <a href="https://stareduca.ai/dashboard/payouts" style="display: inline-block; background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Ver mis pagos
          </a>
        </div>
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
