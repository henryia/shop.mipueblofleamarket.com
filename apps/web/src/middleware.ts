import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Aplica a todas las rutas excepto archivos estáticos y API routes internas
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
