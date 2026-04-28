import * as React from 'react'
import { cn } from '../lib/utils'

// ─── ProductCard — tarjeta de producto estilo TikTok Shop ─────────────────
// Mobile-first: 2 columnas en móvil, 3-4 en desktop

export interface ProductCardProps {
  title: string
  price: number        // en cents
  imageUrl?: string
  videoUrl?: string    // si hay video, autoplay silencioso
  vendorName: string
  vendorSlug: string
  slug: string
  locale?: 'es' | 'en'
  className?: string
  onClick?: () => void
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      title,
      price,
      imageUrl,
      videoUrl,
      vendorName,
      slug,
      className,
      onClick,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md active:scale-[0.98]',
          className,
        )}
        onClick={onClick}
        role="article"
        aria-label={title}
      >
        {/* Media */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          {videoUrl ? (
            <video
              src={videoUrl}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={imageUrl}
            />
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-medium leading-tight text-gray-900">
            {title}
          </p>
          <p className="text-xs text-gray-500">{vendorName}</p>
          <p className="mt-1 text-base font-bold text-brand-600">
            {formatPrice(price)}
          </p>
        </div>

        {/* Overlay tap en mobile */}
        <span className="absolute inset-0" aria-hidden="true" />
      </div>
    )
  },
)
ProductCard.displayName = 'ProductCard'

export { ProductCard }
