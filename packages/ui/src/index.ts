// ─── Barrel export de @shop/ui ────────────────────────────────────────────
// Agregar aquí cada nuevo componente que se cree

export { Button, buttonVariants } from './components/button'
export type { ButtonProps } from './components/button'

export { Badge, badgeVariants } from './components/badge'
export type { BadgeProps } from './components/badge'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/card'

export { ProductCard } from './components/product-card'
export type { ProductCardProps } from './components/product-card'

export { cn } from './lib/utils'
