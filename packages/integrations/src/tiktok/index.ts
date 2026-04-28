// ─── Adapter TikTok Shop API (STUB — Fase 7 post-lanzamiento) ─────────────
// Este archivo existe desde el día 1 porque la arquitectura multicanal lo requiere.
// Véase ARQUITECTURA-Y-PLAN-MVP.md §3.3 (catálogo canónico + adaptadores)
//
// El catálogo ya tiene la tabla ProductChannel con channel=TIKTOK_SHOP.
// Cuando TikTok Shop API esté disponible para la cuenta de Mi Pueblo, activar aquí.

export interface TikTokProduct {
  id: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  inventory: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface TikTokOrder {
  id: string
  status: string
  totalCents: number
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  buyer: {
    name: string
    phone: string
    address: string
  }
}

// ── Stubs — implementar en Fase 7 ─────────────────────────────────────────

export async function syncProductToTikTok(_productId: string): Promise<string> {
  // TODO Fase 7: publicar producto en TikTok Shop, retornar externalId
  throw new Error('TikTok Shop adapter not implemented — Fase 7')
}

export async function updateProductInTikTok(_externalId: string, _data: Partial<TikTokProduct>): Promise<void> {
  // TODO Fase 7: actualizar producto existente en TikTok Shop
  throw new Error('TikTok Shop adapter not implemented — Fase 7')
}

export async function syncInventoryToTikTok(_externalId: string, _stock: number): Promise<void> {
  // TODO Fase 7: sincronizar stock con TikTok Shop
  throw new Error('TikTok Shop adapter not implemented — Fase 7')
}

export async function normalizeOrderFromTikTok(_tikTokOrder: TikTokOrder) {
  // TODO Fase 7: convertir orden de TikTok al formato interno de Order
  throw new Error('TikTok Shop adapter not implemented — Fase 7')
}
