import { router, publicProcedure, vendorProcedure, z } from '../trpc'
import { prisma, ProductStatus } from '@shop/db'
import { TRPCError } from '@trpc/server'

export const productsRouter = router({
  // Listado público con paginación y filtros
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        categorySlug: z.string().optional(),
        vendorSlug: z.string().optional(),
        query: z.string().optional(),
        locale: z.enum(['es', 'en']).default('es'),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor, categorySlug, vendorSlug, query } = input

      const products = await prisma.product.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor } } : {}),
        where: {
          status: ProductStatus.ACTIVE,
          ...(categorySlug && {
            category: { slug: categorySlug },
          }),
          ...(vendorSlug && {
            vendor: { slug: vendorSlug },
          }),
        },
        include: {
          vendor: { select: { storeName: true, slug: true, logoUrl: true } },
          variants: { where: { isDefault: true }, take: 1 },
          media: { where: { position: 0 }, take: 1 },
        },
        orderBy: { publishedAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (products.length > limit) {
        const next = products.pop()
        nextCursor = next?.id
      }

      return { products, nextCursor }
    }),

  // Detalle de producto por slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { slug: input.slug, status: ProductStatus.ACTIVE },
        include: {
          vendor: { select: { storeName: true, slug: true, logoUrl: true, bio: true } },
          variants: true,
          media: { orderBy: { position: 'asc' } },
          category: true,
        },
      })

      if (!product) throw new TRPCError({ code: 'NOT_FOUND' })
      return product
    }),

  // ── Vendor procedures ──────────────────────────────────────────────────
  // TODO Fase 2: implementar create, update, delete de productos
  myProducts: vendorProcedure.query(async ({ ctx }) => {
    return prisma.product.findMany({
      where: { vendorId: ctx.vendorId },
      include: { variants: true, media: { take: 1 } },
      orderBy: { updatedAt: 'desc' },
    })
  }),
})
