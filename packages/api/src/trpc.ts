// ─── Inicialización de tRPC ────────────────────────────────────────────────
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
import { prisma } from '@shop/db'

// Contexto disponible en todos los routers
export interface TRPCContext {
  req: Request
  user?: {
    id: string
    email: string
    role: string
  } | null
}

export async function createTRPCContext({ req }: { req: Request }): Promise<TRPCContext> {
  // TODO Fase 1: extraer session de Auth.js
  // const session = await auth()
  return {
    req,
    user: null,
  }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

// Procedimiento público (no requiere auth)
export const router = t.router
export const publicProcedure = t.procedure

// Middleware de autenticación
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// Middleware de vendor aprobado
const isApprovedVendor = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

  const vendor = await prisma.vendor.findUnique({
    where: { userId: ctx.user.id },
    select: { id: true, status: true },
  })

  if (!vendor || vendor.status !== 'APPROVED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Vendor not approved' })
  }

  return next({ ctx: { ...ctx, user: ctx.user, vendorId: vendor.id } })
})

// Middleware de admin
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const protectedProcedure = t.procedure.use(isAuthed)
export const vendorProcedure = t.procedure.use(isAuthed).use(isApprovedVendor)
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin)

// Re-export zod para uso en routers
export { z }
