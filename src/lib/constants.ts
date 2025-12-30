// ============================================================================
// CONSTANTES DE STAREDUCA
// ============================================================================

// Configuración de la aplicación
export const APP_NAME = 'StarEduca'
export const APP_DESCRIPTION = 'Plataforma de marketing de afiliados'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stareduca.ai'

// Configuración de afiliados
export const COMMISSION_RATE = 0.80 // 80%
export const MIN_PAYOUT_AMOUNT = 10 // $10 USD mínimo para retiro
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
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  referrals: '/dashboard/referrals',
  earnings: '/dashboard/earnings',
  links: '/dashboard/links',
  payouts: '/dashboard/payouts',
  settings: '/dashboard/settings',
} as const

// Rutas del sidebar
export const SIDEBAR_ITEMS = [
  { name: 'Dashboard', href: ROUTES.dashboard, icon: 'LayoutDashboard' },
  { name: 'Mis Referidos', href: ROUTES.referrals, icon: 'Users' },
  { name: 'Ganancias', href: ROUTES.earnings, icon: 'DollarSign' },
  { name: 'Mis Links', href: ROUTES.links, icon: 'Link' },
  { name: 'Pagos', href: ROUTES.payouts, icon: 'Wallet' },
  { name: 'Configuración', href: ROUTES.settings, icon: 'Settings' },
] as const

// Estados de referidos con colores (Tailwind classes)
export const REFERRAL_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  converted: { label: 'Convertido', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  active: { label: 'Activo', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  churned: { label: 'Cancelado', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
  expired: { label: 'Expirado', bgColor: 'bg-slate-600/20', textColor: 'text-slate-400' },
  cancelled: { label: 'Cancelado', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
} as const

// Estados de comisiones con colores (Tailwind classes)
export const COMMISSION_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  approved: { label: 'Aprobada', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
  paid: { label: 'Pagada', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  cancelled: { label: 'Cancelada', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
} as const

// Estados de pagos con colores (Tailwind classes)
export const PAYOUT_STATUS = {
  pending: { label: 'Pendiente', bgColor: 'bg-amber-600/20', textColor: 'text-amber-400' },
  processing: { label: 'Procesando', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
  completed: { label: 'Completado', bgColor: 'bg-green-600/20', textColor: 'text-green-400' },
  failed: { label: 'Fallido', bgColor: 'bg-red-600/20', textColor: 'text-red-400' },
  cancelled: { label: 'Cancelado', bgColor: 'bg-slate-600/20', textColor: 'text-slate-400' },
} as const

// Métodos de pago
export const PAYMENT_METHODS = {
  paypal: { label: 'PayPal', icon: 'Wallet' },
  bank_transfer: { label: 'Transferencia Bancaria', icon: 'Building' },
  stripe: { label: 'Stripe', icon: 'CreditCard' },
  crypto: { label: 'Criptomonedas', icon: 'Bitcoin' },
  manual: { label: 'Manual', icon: 'HandCoins' },
} as const

// Formateo de moneda (recibe dólares, no centavos)
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
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

// Formateo de fecha relativa
export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  return `Hace ${Math.floor(diffDays / 365)} años`
}
