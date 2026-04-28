import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

// ─── Button — componente base mobile-first ───────────────────────────────
// Mínimo 44px de altura para cumplir WCAG / touch targets

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500',
        secondary:
          'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-600',
        outline:
          'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500',
        ghost:
          'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        link:
          'text-brand-600 underline-offset-4 hover:underline focus-visible:ring-brand-500',
      },
      size: {
        default: 'h-11 px-6 py-2',   // 44px mínimo
        sm:      'h-9 px-4 text-xs',
        lg:      'h-14 px-8 text-base',
        icon:    'h-11 w-11',         // botón cuadrado de icono
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
