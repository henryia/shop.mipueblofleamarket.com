// ═══════════════════════════════════════════════════════════════════════════
// Worker entrypoint — shop.mipueblofleamarket.com
// Inicia todos los workers de BullMQ
// ═══════════════════════════════════════════════════════════════════════════

import { startEmailWorker } from './workers/email.worker'
import { startPayoutWorker } from './workers/payout.worker'
import { startVideoWorker } from './workers/video.worker'
import { payoutQueue } from './queues'

async function main() {
  console.log('🚀 Iniciando workers de Mi Pueblo Shop...')

  // Iniciar workers
  const emailWorker = startEmailWorker()
  const payoutWorker = startPayoutWorker()
  const videoWorker = startVideoWorker()

  console.log('✅ Email worker iniciado')
  console.log('✅ Payout worker iniciado')
  console.log('✅ Video worker iniciado')

  // Programar payout semanal — todos los lunes a las 9am ET
  // Se ejecuta automáticamente con BullMQ repeat
  await payoutQueue.upsertJobScheduler(
    'weekly-payout',
    {
      // Cron: lunes a las 9am ET (14:00 UTC)
      pattern: '0 14 * * 1',
      tz: 'America/New_York',
    },
    {
      name: 'weekly-payout',
      data: {
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
      },
    },
  )
  console.log('✅ Payout semanal programado (lunes 9am ET)')

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`\n⚠️  Señal ${signal} recibida. Cerrando workers...`)
    await emailWorker.close()
    await payoutWorker.close()
    await videoWorker.close()
    console.log('👋 Workers cerrados correctamente')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  console.log('\n👷 Todos los workers están corriendo. Esperando jobs...\n')
}

main().catch((err) => {
  console.error('❌ Error fatal en worker:', err)
  process.exit(1)
})
