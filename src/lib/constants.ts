// ============================================================================
// CONSTANTES DE STAREDUCA - PLATAFORMA EDUCATIVA
// ============================================================================

// Configuración de la aplicación
export const APP_NAME = 'StarEduca'
export const APP_DESCRIPTION = 'Plataforma educativa para emprendedores'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stareduca.ai'
export const EMAIL_DOMAIN = 'starbizacademy.com'

// Configuración de precios
export const PRICES = {
  USD: {
    monthly: 1499, // $14.99 en centavos
    yearly: 9900, // $99.00 en centavos
  },
  PEN: {
    monthly: 3500, // S/35.00 en céntimos
    yearly: 31500, // S/315.00 en céntimos
  },
} as const

// Configuración de afiliados
export const COMMISSION_RATE = 0.80 // 80%
export const MIN_PAYOUT_AMOUNT_CENTS = 1000 // $10 USD mínimo para retiro
export const REFERRAL_COOKIE_DAYS = 30 // Días que dura la cookie de referido

// Colores del tema (consistentes con Starbooks)
export const COLORS = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  background: '#0F172A',
  backgroundLight: '#1E293B',
  surface: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
} as const

// Rutas de navegación
export const ROUTES = {
  // Públicas
  home: '/',
  pricing: '/pricing',
  login: '/login',
  register: '/register',
  registerPayment: '/register/payment',
  registerComplete: '/register/complete',
  forgotPassword: '/forgot-password',

  // Dashboard del estudiante
  dashboard: '/dashboard',
  courses: '/courses',
  community: '/community',
  settings: '/settings',

  // Afiliados
  affiliate: '/affiliate',
  affiliateEarnings: '/affiliate/earnings',
  affiliatePayouts: '/affiliate/payouts',

  // Admin
  admin: '/admin',
  adminCourses: '/admin/courses',
  adminStudents: '/admin/students',
  adminAnalytics: '/admin/analytics',
} as const

// Items del sidebar principal
export const MAIN_SIDEBAR_ITEMS = [
  { name: 'Dashboard', href: ROUTES.dashboard, icon: 'LayoutDashboard' },
  { name: 'Cursos', href: ROUTES.courses, icon: 'GraduationCap' },
  { name: 'Comunidad', href: ROUTES.community, icon: 'Users' },
  { name: 'Afiliados', href: ROUTES.affiliate, icon: 'Share2' },
  { name: 'Configuración', href: ROUTES.settings, icon: 'Settings' },
] as const

// Items del sidebar de afiliados
export const AFFILIATE_SIDEBAR_ITEMS = [
  { name: 'Dashboard', href: ROUTES.affiliate, icon: 'LayoutDashboard' },
  { name: 'Ganancias', href: ROUTES.affiliateEarnings, icon: 'DollarSign' },
  { name: 'Pagos', href: ROUTES.affiliatePayouts, icon: 'Wallet' },
] as const

// Estados de suscripción con colores
export const SUBSCRIPTION_STATUS = {
  active: { label: 'Activa', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  inactive: { label: 'Inactiva', bgColor: 'bg-slate-600/20', textColor: 'text-slate-400' },
  canceled: { label: 'Cancelada', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
  past_due: { label: 'Vencida', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  trialing: { label: 'Prueba', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
} as const

// Estados de comisiones con colores
export const COMMISSION_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  approved: { label: 'Aprobada', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
  paid: { label: 'Pagada', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  cancelled: { label: 'Cancelada', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
} as const

// Estados de pagos con colores
export const PAYOUT_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  processing: { label: 'Procesando', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
  completed: { label: 'Completado', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  failed: { label: 'Fallido', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
  cancelled: { label: 'Cancelado', bgColor: 'bg-slate-600/20', textColor: 'text-slate-400' },
} as const

// Estados de referidos con colores
export const REFERRAL_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  converted: { label: 'Convertido', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  expired: { label: 'Expirado', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
  cancelled: { label: 'Cancelado', bgColor: 'bg-slate-600/20', textColor: 'text-slate-400' },
} as const

// Estados de pagos de estudiantes
export const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  processing: { label: 'Procesando', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
  succeeded: { label: 'Exitoso', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  failed: { label: 'Fallido', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
  refunded: { label: 'Reembolsado', bgColor: 'bg-purple-600/20', textColor: 'text-purple-400' },
  canceled: { label: 'Cancelado', bgColor: 'bg-slate-600/20', textColor: 'text-slate-400' },
} as const

// Métodos de pago para payouts
export const PAYOUT_METHODS = {
  paypal: { label: 'PayPal', icon: 'Wallet' },
  bank_transfer: { label: 'Transferencia Bancaria', icon: 'Building' },
  stripe: { label: 'Stripe', icon: 'CreditCard' },
} as const

// Proveedores de pago
export const PAYMENT_PROVIDERS = {
  stripe: { label: 'Tarjeta de Crédito/Débito', icon: 'CreditCard' },
  culqi: { label: 'Yape / Pago local (Perú)', icon: 'Smartphone' },
} as const

// Paises soportados para pagos
export const SUPPORTED_COUNTRIES = {
  PE: {
    code: 'PE',
    name: 'Peru',
    nameEn: 'Peru',
    flag: '\u{1F1F5}\u{1F1EA}', // 🇵🇪
    currency: 'PEN',
    currencySymbol: 'S/',
    defaultProvider: 'culqi' as const,
    paymentMethods: [
      { id: 'yape', label: 'Yape', icon: 'Smartphone', color: '#6B21A8', provider: 'culqi' },
      { id: 'plin', label: 'Plin', icon: 'Smartphone', color: '#059669', provider: 'culqi' },
      { id: 'card_culqi', label: 'Tarjeta (Culqi)', icon: 'CreditCard', color: '#6366F1', provider: 'culqi' },
    ],
    locale: 'es-PE',
  },
  US: {
    code: 'US',
    name: 'Estados Unidos',
    nameEn: 'United States',
    flag: '\u{1F1FA}\u{1F1F8}', // 🇺🇸
    currency: 'USD',
    currencySymbol: '$',
    defaultProvider: 'stripe' as const,
    paymentMethods: [
      { id: 'card_stripe', label: 'Tarjeta de Crédito/Débito', icon: 'CreditCard', color: '#6366F1', provider: 'stripe' },
    ],
    locale: 'en-US',
  },
} as const

export type CountryCode = keyof typeof SUPPORTED_COUNTRIES
export type PaymentMethod = typeof SUPPORTED_COUNTRIES[CountryCode]['paymentMethods'][number]

// Tipos de reacción
export const REACTION_TYPES = {
  like: { label: 'Me gusta', emoji: '👍' },
  love: { label: 'Me encanta', emoji: '❤️' },
  celebrate: { label: 'Celebrar', emoji: '🎉' },
  insightful: { label: 'Interesante', emoji: '💡' },
  curious: { label: 'Curioso', emoji: '🤔' },
} as const

// Tipos de material de capítulo
export const MATERIAL_TYPES = {
  pdf: { label: 'PDF', icon: 'FileText' },
  link: { label: 'Enlace', icon: 'ExternalLink' },
  text: { label: 'Texto', icon: 'AlignLeft' },
  download: { label: 'Descarga', icon: 'Download' },
  video: { label: 'Video', icon: 'Play' },
} as const

// ============================================================================
// FUNCIONES DE FORMATEO
// ============================================================================

// Formateo de moneda (recibe centavos)
export function formatCurrency(amountCents: number, currency = 'USD'): string {
  const amount = amountCents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Formateo de moneda para Perú
export function formatPEN(amountCentimos: number): string {
  const amount = amountCentimos / 100
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount)
}

// Formateo de porcentaje
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('es-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

// Formateo de fecha
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

// Formateo de fecha con hora
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Formateo de fecha relativa
export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Ahora'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  return `Hace ${Math.floor(diffDays / 365)} años`
}

// Formateo de duración (segundos a mm:ss o hh:mm:ss)
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Formateo de tamaño de archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Generar iniciales de nombre
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar password alfanumérico
export function isValidPassword(password: string): boolean {
  // Mínimo 8 caracteres, solo alfanumérico
  const passwordRegex = /^[a-zA-Z0-9]{8,}$/
  return passwordRegex.test(password)
}

// Formatear precio para mostrar (recibe dolares, no centavos)
export function formatPrice(amount: number, currency: 'USD' | 'PEN' = 'USD'): string {
  if (currency === 'PEN') {
    return `S/${amount.toFixed(2)}`
  }
  return `$${amount.toFixed(2)}`
}

// Generar email desde código de estudiante
export function generateEmailFromCode(studentCode: string): string {
  // ABC-123456 -> abc123456@starbizacademy.com
  const code = studentCode.toLowerCase().replace('-', '')
  return `${code}@${EMAIL_DOMAIN}`
}
