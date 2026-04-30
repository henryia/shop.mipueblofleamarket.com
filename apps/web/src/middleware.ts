import createMiddleware from 'next-intl/middleware'
import { auth } from './lib/auth'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

// Rutas que requieren autenticación
const PROTECTED = ['/vendor', '/admin', '/account', '/checkout']
// Rutas solo para no-autenticados
const AUTH_ONLY = ['/auth/signin', '/auth/signup']

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Quitar el prefijo de locale para evaluar la ruta
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'

  const isProtected = PROTECTED.some(p => pathnameWithoutLocale.startsWith(p))
  const isAuthOnly  = AUTH_ONLY.some(p => pathnameWithoutLocale.startsWith(p))

  if (isProtected || isAuthOnly) {
    const session = await auth()

    if (isProtected && !session) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    if (isAuthOnly && session) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
