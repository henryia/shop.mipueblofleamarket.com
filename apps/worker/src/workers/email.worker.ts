// ─── Worker de emails (Resend + React Email) ──────────────────────────────
// 🧠 Claude Skill relevante: cuando generemos plantillas HTML de email (Fase 3)
//    usaremos el skill "docx" para previsualizar el contenido, y React Email
//    para el envío real.

import { Worker } from 'bullmq'
import { redisConnection } from '../redis'
import type { EmailJobData } from '../queues'

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    'email',
    async (job) => {
      const { type, to, locale, payload } = job.data
      console.log(`[Email Worker] Procesando job ${type} para ${to} (locale: ${locale})`)

      // TODO Fase 3: implementar con Resend + React Email
      // switch (type) {
      //   case 'order.confirmed':
      //     await resend.emails.send({
      //       from: process.env.EMAIL_FROM!,
      //       to,
      //       subject: t('orderConfirmed.subject', locale),
      //       react: OrderConfirmedEmail({ ...payload, locale }),
      //     })
      //     break
      // }

      console.log(`[Email Worker] ✅ ${type} enviado a ${to}`)
    },
    {
      connection: redisConnection,
      concurrency: 10,
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`[Email Worker] ❌ Job ${job?.id} falló:`, err.message)
  })

  return worker
}
