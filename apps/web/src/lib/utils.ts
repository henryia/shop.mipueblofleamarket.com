import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases Tailwind sin conflictos */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea centavos a moneda USD */
export function formatCurrency(cents: number, locale = 'es-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/** Genera número de orden legible: MP-2026-000123 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0')
  return `MP-${year}-${random}`
}

/** Trunca texto con elipsis */
export function truncate(text: string, length: number): string {
  return text.length <= length ? text : `${text.slice(0, length)}…`
}

/** Espera N milisegundos */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
