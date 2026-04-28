import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // requerido por BullMQ
  enableReadyCheck: false,
})

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err)
})

redisConnection.on('connect', () => {
  console.log('[Redis] Connected')
})
