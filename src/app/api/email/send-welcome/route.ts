import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { to, username, studentCode, referralCode, appName } = await request.json()

    // Validar campos requeridos
    if (!to || !username || !studentCode || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Enviar email
    const result = await sendWelcomeEmail({
      to,
      username,
      studentCode,
      referralCode,
      appName,
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Send welcome email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
