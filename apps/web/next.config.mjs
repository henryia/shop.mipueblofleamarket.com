import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpila paquetes del workspace
  transpilePackages: ['@shop/ui', '@shop/db', '@shop/api'],

  images: {
    remotePatterns: [
      {
        // Cloudflare R2 CDN
        protocol: 'https',
        hostname: 'media.shop.mipueblofleamarket.com',
      },
      {
        // Imágenes placeholder para desarrollo
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  experimental: {
    // Optimizaciones de paquetes
    optimizePackageImports: ['lucide-react', '@shop/ui'],
  },
}

export default withNextIntl(nextConfig)
