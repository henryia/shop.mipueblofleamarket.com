// ─── Adapter Resend (emails transaccionales) ──────────────────────────────
// 🧠 Claude Skill relevante: en Fase 3 cuando creemos las plantillas de email,
//    usaremos React Email + posiblemente el skill "docx" o "pdf" para generar
//    facturas adjuntas en los emails de confirmación.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'Mi Pueblo Shop <noreply@shop.mipueblofleamarket.com>'

// ── Interfaz base de email ─────────────────────────────────────────────────
interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}

// ── Templates stub — se implementan en Fase 3 ─────────────────────────────

export async function sendOrderConfirmedEmail(_params: {
  to: string
  locale: 'es' | 'en'
  orderNumber: string
  totalCents: number
}) {
  // TODO Fase 3: implementar con React Email template
  throw new Error('Not implemented — Fase 3')
}

export async function sendVendorApprovedEmail(_params: {
  to: string
  locale: 'es' | 'en'
  storeName: string
}) {
  // TODO Fase 1: implementar con React Email template
  throw new Error('Not implemented — Fase 1')
}

export async function sendPayoutSentEmail(_params: {
  to: string
  locale: 'es' | 'en'
  amountCents: number
  periodStart: string
  periodEnd: string
}) {
  // TODO Fase 5: implementar con React Email template
  throw new Error('Not implemented — Fase 5')
}
