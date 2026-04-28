import { router, publicProcedure, adminProcedure, z } from '../trpc'
import { prisma, VendorStatus } from '@shop/db'
import { TRPCError } from '@trpc/server'

export const vendorsRouter = router({
  // Perfil público de una tienda
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const vendor = await prisma.vendor.findUnique({
        where: { slug: input.slug, status: VendorStatus.APPROVED },
        select: {
          id: true,
          storeName: true,
          slug: true,
          bio: true,
          logoUrl: true,
          bannerUrl: true,
          shippingMode: true,
          acceptsReturns: true,
          approvedAt: true,
        },
      })
      if (!vendor) throw new TRPCError({ code: 'NOT_FOUND' })
      return vendor
    }),

  // ── Admin procedures ───────────────────────────────────────────────────
  // TODO Fase 1: aprobar/rechazar vendors
  listPending: adminProcedure.query(async () => {
    return prisma.vendor.findMany({
      where: { status: VendorStatus.UNDER_REVIEW },
      include: { user: { select: { email: true, name: true } }, documents: true },
      orderBy: { createdAt: 'asc' },
    })
  }),

  approve: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return prisma.vendor.update({
        where: { id: input.vendorId },
        data: {
          status: VendorStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: ctx.user.id,
        },
      })
    }),

  reject: adminProcedure
    .input(z.object({ vendorId: z.string(), reason: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.vendor.update({
        where: { id: input.vendorId },
        data: { status: VendorStatus.REJECTED, rejectionReason: input.reason },
      })
    }),
})
