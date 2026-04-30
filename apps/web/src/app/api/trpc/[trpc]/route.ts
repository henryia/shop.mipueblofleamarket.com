import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@shop/api'
import { createTRPCContext } from '@shop/api'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
    ...(process.env.NODE_ENV === 'development' && {
      onError: ({ path, error }: { path?: string; error: unknown }) => {
        console.error(`tRPC error on ${path ?? '<no-path>'}:`, error)
      },
    }),
  })

export { handler as GET, handler as POST }
