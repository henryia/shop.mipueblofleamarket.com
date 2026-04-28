// ─── App Router — punto de entrada de la API tRPC ─────────────────────────
export { createTRPCContext } from './trpc'
export type { TRPCContext } from './trpc'

import { router } from './trpc'
import { productsRouter } from './routers/products'
import { vendorsRouter } from './routers/vendors'
import { cartRouter } from './routers/cart'
import { ordersRouter } from './routers/orders'

export const appRouter = router({
  products: productsRouter,
  vendors: vendorsRouter,
  cart: cartRouter,
  orders: ordersRouter,
  // TODO Fase 1: auth router
  // TODO Fase 3: checkout router, stripe router
  // TODO Fase 4: shipments router
  // TODO Fase 5: payouts router
})

export type AppRouter = typeof appRouter
