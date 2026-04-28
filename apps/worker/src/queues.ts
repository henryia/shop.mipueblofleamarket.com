// ─── Definición de colas BullMQ ────────────────────────────────────────────
import { Queue } from 'bullmq'
import { redisConnection } from './redis'

// Tipos de jobs por cola
export interface EmailJobData {
  type: 'order.confirmed' | 'vendor.approved' | 'vendor.rejected' | 'shipment.shipped' | 'payout.sent' | 'password.reset'
  to: string
  locale: 'es' | 'en'
  payload: Record<string, unknown>
}

export interface PayoutJobData {
  vendorId?: string // si es undefined, procesar todos los vendors pendientes
  periodStart: string // ISO date
  periodEnd: string   // ISO date
  forced?: boolean    // payout manual del admin
}

export interface VideoJobData {
  productId: string
  mediaId: string
  sourceUrl: string   // URL del archivo original en R2
  outputKey: string   // key de destino en R2 para el HLS
}

export interface ShipmentSyncJobData {
  shipmentId: string
  easypostShipmentId: string
}

// Colas — nombres consistentes con el entorno
const queueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
}

export const emailQueue = new Queue<EmailJobData>('email', queueOptions)
export const payoutQueue = new Queue<PayoutJobData>('payout', queueOptions)
export const videoQueue = new Queue<VideoJobData>('video', queueOptions)
export const shipmentSyncQueue = new Queue<ShipmentSyncJobData>('shipment-sync', queueOptions)
