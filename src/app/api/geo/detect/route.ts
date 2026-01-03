// ============================================================================
// API: DETECCION DE PAIS POR IP
// GET /api/geo/detect
// Detecta el pais del usuario basandose en su IP
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 1. Primero intentar con headers de Vercel (en produccion)
    const vercelCountry = request.headers.get('x-vercel-ip-country')

    if (vercelCountry) {
      return NextResponse.json({
        success: true,
        country: vercelCountry,
        source: 'vercel',
      })
    }

    // 2. En desarrollo, usar API externa gratuita
    // ipapi.co permite 1000 requests/dia gratis
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     '8.8.8.8' // Default para desarrollo local

    // Si es IP local, retornar default
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.')) {
      // En desarrollo, podemos simular Peru o USA
      // Checkear si hay un query param para testing
      const testCountry = request.nextUrl.searchParams.get('test')
      if (testCountry) {
        return NextResponse.json({
          success: true,
          country: testCountry.toUpperCase(),
          source: 'test',
        })
      }

      // Default a US para desarrollo
      return NextResponse.json({
        success: true,
        country: 'US',
        source: 'default',
      })
    }

    // Llamar a API externa para obtener pais
    const response = await fetch(`https://ipapi.co/${clientIp}/country/`, {
      headers: {
        'User-Agent': 'StarEduca/1.0',
      },
    })

    if (response.ok) {
      const countryCode = await response.text()

      // Validar que sea un codigo de pais valido (2 letras)
      if (countryCode && countryCode.length === 2) {
        return NextResponse.json({
          success: true,
          country: countryCode.toUpperCase(),
          source: 'ipapi',
        })
      }
    }

    // Fallback a US si falla la deteccion
    return NextResponse.json({
      success: true,
      country: 'US',
      source: 'fallback',
    })

  } catch (error) {
    console.error('Error detectando pais:', error)

    // En caso de error, retornar US como default
    return NextResponse.json({
      success: true,
      country: 'US',
      source: 'error-fallback',
    })
  }
}
