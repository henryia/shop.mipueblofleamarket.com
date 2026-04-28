// ─── Worker de payouts semanales ──────────────────────────────────────────
// Se ejecuta todos los lunes a las 9am ET vía scheduler de BullMQ
// Patrón: "separate charges and transfers" de Stripe Connect

import { Worker } from 'bullmq'
import { redisConnection } from '../redis'
import type { PayoutJobData } from '../queues'

export function startPayoutWorker() {
  const worker = new Worker<PayoutJobData>(
    'payout',
    async (job) => {
      const { vendorId, periodStart, periodEnd, forced } = job.data
      console.log(`[Payout Worker] Procesando payout ${forced ? '(manual) ' : ''}${vendorId ? `vendor=${vendorId}` : 'todos'} período ${periodStart}→${periodEnd}`)

      // TODO Fase 5: implementar lógica completa
      // 1. Buscar LedgerEntry pendientes (payoutId IS NULL)
      // 2. Agrupar por vendor
      // 3. Para cada vendor con netCents > 0:
      //    a. Crear Payout en DB con status PENDING
      //    b. stripe.transfers.create({ amount: netCents, destination: stripeAccountId })
      //    c. Actualizar Payout.status = PAID + stripeTransferId
      //    d. Actualizar LedgerEntry.payoutId
      //    e. Encolar email de notificación al vendor

      console.log(`[Payout Worker] ✅ Payout completado`)
    },
    {
      connection: redisConnection,
      concurrency: 2, // payouts son operaciones sensibles, baja concurrencia
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`[Payout Worker] ❌ Job ${job?.id} falló:`, err.message)
    // TODO: alertar al admin vía email/Sentry
  })

  return worker
}
