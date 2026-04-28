// ─── Worker de transcodificación de video ─────────────────────────────────
// Input: MP4/MOV subido a R2
// Output: HLS adaptativo (.m3u8 + .ts segments) de vuelta en R2

import { Worker } from 'bullmq'
import { redisConnection } from '../redis'
import type { VideoJobData } from '../queues'

export function startVideoWorker() {
  const worker = new Worker<VideoJobData>(
    'video',
    async (job) => {
      const { productId, mediaId, sourceUrl, outputKey } = job.data
      console.log(`[Video Worker] Transcodificando video mediaId=${mediaId} productId=${productId}`)

      // TODO Fase 2: implementar con ffmpeg
      // 1. Descargar archivo de R2 (sourceUrl) a /tmp
      // 2. ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 23 -c:a aac
      //          -hls_time 6 -hls_list_size 0 output.m3u8
      // 3. Subir todos los segmentos .ts y el .m3u8 a R2 bajo outputKey/
      // 4. Generar thumbnail con ffmpeg -ss 00:00:01 -vframes 1 thumb.jpg
      // 5. Actualizar ProductMedia.url y .thumbnailUrl en DB
      // 6. Eliminar archivo temporal de /tmp

      console.log(`[Video Worker] ✅ Video transcodificado para producto ${productId}`)
    },
    {
      connection: redisConnection,
      concurrency: 2, // ffmpeg es CPU-intensivo
      limiter: {
        max: 5,
        duration: 60000, // 5 videos por minuto máximo
      },
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`[Video Worker] ❌ Job ${job?.id} falló:`, err.message)
  })

  return worker
}
