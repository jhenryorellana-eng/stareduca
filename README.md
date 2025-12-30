# StarEduca

Plataforma de marketing de afiliados para Starbooks.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** PayPal Payouts API
- **Email:** Resend
- **Hosting:** Vercel

## Features

- Dashboard de afiliados
- Sistema de referidos con links personalizados
- Comisiones recurrentes (80%)
- Pagos automáticos via PayPal
- Deep linking para iOS y Android
- Perfiles públicos de afiliados
- Página de política de privacidad
- Página de eliminación de cuenta

## Getting Started

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

## Environment Variables

Ver `.env.example` para la lista completa de variables requeridas.

## Deployment

Ver `DEPLOYMENT.md` para instrucciones detalladas de deployment en Vercel.

## URLs Importantes

- **Producción:** https://stareduca.ai
- **Política de Privacidad:** https://stareduca.ai/privacy
- **Eliminación de Cuenta:** https://stareduca.ai/delete-account

## License

Private - All rights reserved.
