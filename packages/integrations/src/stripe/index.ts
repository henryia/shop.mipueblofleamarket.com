// ─── Adapter Stripe ────────────────────────────────────────────────────────
// Patrón: "Separate charges and transfers" (decisión en HANDOFF §6)
// La plataforma cobra al buyer → transfiere a cada vendor en payout semanal

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no configurada')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// ── Crear PaymentIntent para checkout ─────────────────────────────────────
export async function createPaymentIntent(params: {
  amountCents: number
  currency?: string
  metadata?: Record<string, string>
}) {
  return stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: params.currency ?? 'usd',
    metadata: params.metadata ?? ({} as Record<string, string>),
    automatic_payment_methods: { enabled: true },
  })
}

// ── Crear cuenta Connect Express para vendor ──────────────────────────────
export async function createConnectAccount(email: string) {
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    settings: {
      payouts: { schedule: { interval: 'manual' } },
    },
  })
}

// ── Generar link de onboarding de Stripe Connect ──────────────────────────
export async function createOnboardingLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}

// ── Transferir a vendor (payout) ──────────────────────────────────────────
export async function transferToVendor(params: {
  amountCents: number
  stripeAccountId: string
  description: string
  metadata?: Record<string, string>
}) {
  return stripe.transfers.create({
    amount: params.amountCents,
    currency: 'usd',
    destination: params.stripeAccountId,
    description: params.description,
    metadata: params.metadata ?? {},
  })
}

// ── Reembolso ─────────────────────────────────────────────────────────────
export async function refundPayment(params: {
  paymentIntentId: string
  amountCents?: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
}) {
  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    reason: params.reason ?? 'requested_by_customer',
    ...(params.amountCents !== undefined && { amount: params.amountCents }),
  })
}

// ── Verificar firma de webhook ────────────────────────────────────────────
export function verifyWebhook(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurada')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

export type { Stripe }
