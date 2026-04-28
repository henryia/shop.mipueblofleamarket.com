import { router, protectedProcedure, adminProcedure, vendorProcedure, z } from '../trpc'
import { prisma } from '@shop/db'
import { TRPCError } from '@trpc/server'

export const ordersRouter = router({
  // Mis órdenes como buyer
  myOrders: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const orders = await prisma.order.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: { buyerId: ctx.user.id },
        include: {
          items: {
            include: {
              product: { select: { titleEs: true, titleEn: true } },
              variant: { select: { attributes: true } },
              vendor: { select: { storeName: true } },
            },
          },
          shipments: { select: { trackingNumber: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (orders.length > input.limit) {
        const next = orders.pop()
        nextCursor = next?.id
      }

      return { orders, nextCursor }
    }),

  // Detalle de una orden
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: {
          id: input.id,
          buyerId: ctx.user.id, // solo la propia orden
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
              vendor: { select: { storeName: true, slug: true } },
              shipment: true,
            },
          },
          shipments: true,
          refunds: true,
          shippingAddress: true,
        },
      })

      if (!order) throw new TRPCError({ code: 'NOT_FOUND' })
      return order
    }),

  // ── Vendor: mis pedidos a atender ──────────────────────────────────────
  vendorOrders: vendorProcedure
    .input(z.object({
      status: z.enum(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return prisma.orderItem.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          vendorId: ctx.vendorId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          order: {
            select: {
              number: true,
              shippingAddress: true,
              buyer: { select: { email: true, name: true } },
            },
          },
          product: { select: { titleEs: true, titleEn: true } },
          variant: { select: { attributes: true } },
        },
        orderBy: { order: { createdAt: 'desc' } },
      })
    }),

  // ── Admin: todas las órdenes ───────────────────────────────────────────
  adminList: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const orders = await prisma.order.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: input.status ? { status: input.status as never } : undefined,
        include: {
          buyer: { select: { email: true, name: true } },
          items: { select: { vendorId: true, subtotalCents: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (orders.length > input.limit) {
        const next = orders.pop()
        nextCursor = next?.id
      }

      return { orders, nextCursor }
    }),
})
