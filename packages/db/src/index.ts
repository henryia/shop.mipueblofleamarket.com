// ─── Exporta el cliente de Prisma singleton ───────────────────────────────
// Usar este cliente en TODA la app — nunca instanciar PrismaClient directo.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-exportar todos los tipos de Prisma para que los paquetes que usen @shop/db
// no tengan que importar @prisma/client directamente.
export * from '@prisma/client'
