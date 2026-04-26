# shop.mipueblofleamarket.com

Marketplace multi-vendor de **Mi Pueblo Flea Market**. Plataforma propia estilo TikTok Shop / eBay simplificada, mobile-first, bilingüe (es/en), pensada para 600+ vendors del flea market.

> **Estado actual:** planificación. Documento de arquitectura completo. Pendiente arrancar Fase 0 (scaffold).

---

## ¿Qué es esto?

Un marketplace propio donde:

- **Vendors** se registran, pasan aprobación, conectan Stripe, suben productos con variantes (talla, color, etc.) y atienden pedidos.
- **Buyers** navegan, compran y pagan en una sola transacción aunque la orden tenga productos de varios vendors.
- **Mi Pueblo** (admin) controla aprobaciones, comisiones, sales tax, logística y payouts.

Stripe Connect maneja KYC y payouts. Stripe Tax calcula sales tax US automáticamente. EasyPost maneja etiquetas de envío. Todo bajo el dominio `shop.mipueblofleamarket.com`.

---

## Stack

- **Frontend + backend:** Next.js 14 (App Router) + TypeScript estricto
- **API:** tRPC + Zod
- **DB:** PostgreSQL 16 + Prisma
- **Auth:** Auth.js (NextAuth) multi-rol (buyer / vendor / admin)
- **UI:** Tailwind CSS + shadcn/ui (mobile-first)
- **i18n:** next-intl (es / en)
- **Cache + colas:** Redis + BullMQ
- **Pagos:** Stripe + Stripe Connect (Express) + Stripe Tax
- **Logística:** EasyPost
- **Storage:** Cloudflare R2 + CDN
- **Email:** Resend (React Email)
- **Hosting:** VPS Hostinger Ubuntu 22.04

---

## Estructura (próximamente)

Monorepo con pnpm workspaces:

```
apps/
  web/        # Next.js — storefront + vendor + admin
  worker/     # BullMQ workers (emails, payouts, video transcoding)
packages/
  db/         # Prisma schema + migrations + seed
  api/        # tRPC routers
  ui/         # componentes shadcn compartidos
  config/     # eslint, tsconfig, tailwind preset
  integrations/ # adapters: stripe, easypost, tiktok-shop (futuro)
infra/
  docker/
  nginx/
  deploy/
```

---

## Roadmap

| Fase | Objetivo | Semanas |
|------|----------|---------|
| 0 | Scaffold del monorepo + DB + CI/CD | 1–2 |
| 1 | Auth + onboarding/aprobación de vendors | 3–4 |
| 2 | Catálogo, productos con variantes, storefront | 5–7 |
| 3 | Carrito, checkout, Stripe Connect, emails | 8–10 |
| 4 | Logística (EasyPost) | 11–12 |
| 5 | Payouts semanales, panel admin/vendor completo | 13 |
| 6 | Hardening, beta cerrada, soft launch | 14–15 |
| 7 (post) | Adaptador TikTok Shop API + IA Claude integrada | — |

Detalle completo en [`ARQUITECTURA-Y-PLAN-MVP.md`](./ARQUITECTURA-Y-PLAN-MVP.md).

---

## Setup local (cuando arranque Fase 0)

```bash
# Requisitos: Node 20, pnpm 9, Docker (para Postgres + Redis local)

git clone https://github.com/henryia/shop.mipueblofleamarket.com.git
cd shop.mipueblofleamarket.com

# Variables de entorno
cp .env.example .env
# Llenar valores

# Servicios locales
docker compose up -d postgres redis

# Dependencias y migraciones
pnpm install
pnpm db:migrate
pnpm db:seed

# Dev
pnpm dev
```

---

## Documentación

- [Arquitectura y plan MVP](./ARQUITECTURA-Y-PLAN-MVP.md) — blueprint técnico completo
- (Pendiente) Guía de despliegue VPS Hostinger
- (Pendiente) Runbook de operación

---

## Licencia

Propietario — Mi Pueblo Flea Market. Todos los derechos reservados.
