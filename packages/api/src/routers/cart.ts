import { router, publicProcedure, z } from '../trpc'
import { prisma } from '@shop/db'

export const cartRouter = router({
  // Obtener o crear carrito
  get: publicProcedure
    .input(z.object({ sessionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id

      if (userId) {
        return prisma.cart.findUnique({
          where: { userId },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: {
                      include: {
                        vendor: { select: { storeName: true, slug: true } },
                        media: { where: { position: 0 }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      }

      if (input.sessionId) {
        return prisma.cart.findUnique({
          where: { sessionId: input.sessionId },
          include: { items: { include: { variant: { include: { product: true } } } } },
        })
      }

      return null
    }),

  // Agregar item al carrito
  addItem: publicProcedure
    .input(z.object({
      variantId: z.string(),
      quantity: z.number().min(1).max(99),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id

      // Verificar stock disponible
      const variant = await prisma.productVariant.findUnique({
        where: { id: input.variantId },
        select: { stock: true, price: true },
      })
      if (!variant) throw new Error('Variante no encontrada')
      if (variant.stock < input.quantity) throw new Error('Stock insuficiente')

      // Obtener o crear carrito
      let cart = userId
        ? await prisma.cart.findUnique({ where: { userId } })
        : input.sessionId
        ? await prisma.cart.findUnique({ where: { sessionId: input.sessionId } })
        : null

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            ...(userId ? { userId } : {}),
            ...(input.sessionId ? { sessionId: input.sessionId } : {}),
          },
        })
      }

      // Upsert item
      return prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
        update: { quantity: { increment: input.quantity } },
        create: { cartId: cart.id, variantId: input.variantId, quantity: input.quantity },
      })
    }),

  // Eliminar item
  removeItem: publicProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.cartItem.delete({ where: { id: input.cartItemId } })
    }),
})
