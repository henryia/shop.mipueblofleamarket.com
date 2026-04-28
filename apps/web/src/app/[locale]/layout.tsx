import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mi Pueblo Shop',
    template: '%s | Mi Pueblo Shop',
  },
  description: 'Marketplace de Mi Pueblo Flea Market — Ropa, electrónicos, joyería y más.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://shop.mipueblofleamarket.com'),
  openGraph: {
    type: 'website',
    siteName: 'Mi Pueblo Shop',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = params

  // Verificar locale válido
  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
