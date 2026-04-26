# shop.mipueblofleamarket.com — Arquitectura y Plan MVP

**Versión:** 1.0
**Fecha:** 26 de abril de 2026
**Autor:** Documento técnico inicial
**Stack confirmado:** Next.js 14 + Node + PostgreSQL + Prisma
**Infraestructura objetivo:** VPS Hostinger (Ubuntu)

---

## 1. Resumen ejecutivo

`shop.mipueblofleamarket.com` será un marketplace multi-vendor estilo TikTok Shop / eBay simplificado, diseñado para los **600+ vendors** de Mi Pueblo Flea Market. La plataforma centraliza catálogo, pagos, impuestos, logística y payouts, y queda preparada como **hub multicanal** para que en el futuro los mismos productos puedan publicarse en TikTok Shop u otros canales vía API.

**Principios rectores del MVP:**

1. **Mobile-first y rápido** — la mayoría de vendors y compradores usarán teléfono.
2. **Operación simple para el vendor** — un vendor con bajo nivel técnico debe poder darse de alta, subir un producto con variantes, recibir pedidos y cobrar sin fricción.
3. **Un solo cobro al comprador** — Stripe captura todo (producto + impuesto + envío), la plataforma retiene comisión y costo logístico, y reparte el neto a cada vendor con Stripe Connect.
4. **Arquitectura preparada para multicanal** — el catálogo, inventario y pedidos viven en una sola base de datos canónica; los canales (web propio, TikTok Shop, etc.) son adaptadores.
5. **Bilingüe es/en** desde el día uno.
6. **Escalable a 600+ vendors / decenas de miles de SKUs** sin rediseñar.

**Lo que NO está en el MVP:** live shopping, programa de afiliados, chat en tiempo real, ads manager, reseñas con moderación AI, recomendaciones personalizadas. Se diseñan como hooks/extensiones futuras.

---

## 2. Stack técnico

### 2.1 Frontend y backend (monorepo)

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Framework web | **Next.js 14 (App Router)** | SSR/ISR para SEO del storefront, RSC para performance, API routes para backend |
| Lenguaje | **TypeScript** estricto | Tipado de extremo a extremo, menos bugs en producción |
| UI | **Tailwind CSS + shadcn/ui** | Sistema de diseño rápido, mobile-first, fácil de tematizar con la paleta de Mi Pueblo |
| Estado cliente | **Zustand** + React Query (TanStack) | Carrito, sesión, datos del servidor con cache |
| API interna | **tRPC** o **Next API routes + Zod** | Tipado end-to-end (recomiendo tRPC para velocidad de iteración) |
| Validación | **Zod** | Schemas reutilizables entre frontend y backend |
| Auth | **Auth.js (NextAuth) + JWT** | Email/password, OAuth (Google), magic links; soporta multi-rol |
| ORM | **Prisma** | Migraciones, types autogenerados, excelente DX |
| Base de datos | **PostgreSQL 16** | Soporte de JSONB para variantes, full-text search en español/inglés |
| Cache / colas | **Redis** + **BullMQ** | Sesiones, rate limit, jobs (emails, payouts, sincronización) |
| Búsqueda | **Postgres FTS** (MVP) → **Meilisearch/Typesense** (fase 2) | Empezar simple, migrar cuando crezca |
| Storage de medios | **Cloudflare R2** o **S3** + **CloudFront/Bunny CDN** | Imágenes y videos cortos de productos, sin costo de egress en R2 |
| Procesamiento de imágenes | **sharp** + Next.js Image | Compresión, formatos modernos (AVIF/WebP) |
| Procesamiento de video | **ffmpeg** en worker | Transcodificación a HLS para video corto del producto |
| Pagos | **Stripe** + **Stripe Connect (Express)** | Estándar de facto, KYC integrado, payouts automáticos |
| Impuestos | **Stripe Tax** | Cálculo automático de sales tax US, sin integrar TaxJar separado |
| Logística | **EasyPost** (tarifas + etiquetas) | Multi-courier (USPS, UPS, FedEx), API simple |
| Email | **Resend** o **AWS SES** | Transaccional, plantillas en React Email |
| Analytics | **PostHog self-hosted** | Producto + funnel + sesiones, mismo VPS |
| Monitoring | **Sentry** + **BetterStack/Uptime** | Errores y uptime |
| i18n | **next-intl** | Rutas localizadas `/es` y `/en`, traducciones JSON |
| CI/CD | **GitHub Actions** | Tests, lint, deploy a VPS por SSH/rsync o Docker |

### 2.2 ¿Por qué este stack y no Laravel o Medusa?

- **Frente a Laravel:** Next.js permite renderizar el storefront tipo TikTok con animaciones y video corto en el cliente sin saltos entre tecnologías. TypeScript end-to-end reduce bugs cuando el equipo crece.
- **Frente a Medusa:** Medusa acelera el catálogo/checkout pero su modelo multi-vendor depende de plugins comunitarios y la UX se vuelve menos flexible para imitar TikTok Shop. Un Next.js custom es más trabajo inicial pero **sin techo** para el roadmap multicanal.

### 2.3 Servicios externos (resumen de cuentas a crear)

1. **Stripe + Stripe Connect (Express accounts)** — KYC de vendors, payouts.
2. **Stripe Tax** — sales tax US automático.
3. **EasyPost** (o Shippo) — etiquetas de envío y rate shopping.
4. **Cloudflare** (DNS + R2 + CDN) o **AWS S3 + CloudFront**.
5. **Resend** o **AWS SES** — emails transaccionales.
6. **Sentry** — error tracking.
7. **GitHub** — repositorio y CI/CD.
8. **Hostinger VPS** — KVM 4–8 con Ubuntu 22.04 LTS (ver §10).

---

## 3. Arquitectura del sistema

### 3.1 Vista de alto nivel

```
                    ┌──────────────────────────────────────────┐
                    │           Cloudflare (DNS + WAF)         │
                    └────────────────────┬─────────────────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
        ┌───────▼────────┐      ┌────────▼────────┐      ┌────────▼────────┐
        │   Storefront   │      │  Vendor panel   │      │   Admin panel   │
        │   /es /en      │      │   /vendor       │      │   /admin        │
        │  (Next.js)     │      │   (Next.js)     │      │   (Next.js)     │
        └───────┬────────┘      └────────┬────────┘      └────────┬────────┘
                │                        │                        │
                └────────────────────────┼────────────────────────┘
                                         │
                            ┌────────────▼─────────────┐
                            │   API layer (tRPC)       │
                            │   Auth.js + middlewares  │
                            └────────────┬─────────────┘
                                         │
        ┌────────────┬───────────────────┼──────────────────┬───────────────┐
        │            │                   │                  │               │
   ┌────▼────┐  ┌────▼─────┐      ┌──────▼──────┐    ┌──────▼────┐   ┌──────▼──────┐
   │Postgres │  │  Redis   │      │  BullMQ      │    │  R2/S3     │   │ Externos:    │
   │(canon.) │  │ (cache + │      │  workers     │    │ (media)    │   │ Stripe,      │
   │         │  │  queues) │      │              │    │            │   │ Stripe Tax,  │
   └─────────┘  └──────────┘      └──────────────┘    └────────────┘   │ EasyPost,    │
                                                                        │ Resend,      │
                                                                        │ TikTok (fut.)│
                                                                        └──────────────┘
```

### 3.2 Estructura del repositorio

Monorepo con **pnpm workspaces**:

```
shop.mipueblofleamarket.com/
├── apps/
│   ├── web/                    # Next.js — storefront + vendor + admin
│   │   ├── app/
│   │   │   ├── (storefront)/   # rutas públicas, mobile-first
│   │   │   ├── vendor/         # panel vendor
│   │   │   ├── admin/          # panel admin
│   │   │   └── api/
│   │   ├── components/
│   │   ├── lib/
│   │   └── messages/           # es.json, en.json
│   └── worker/                 # Worker Node para BullMQ (emails, payouts, video)
├── packages/
│   ├── db/                     # Prisma schema + migrations + seed
│   ├── api/                    # tRPC routers compartidos
│   ├── ui/                     # componentes shadcn compartidos
│   ├── config/                 # eslint, tsconfig, tailwind preset
│   └── integrations/           # adapters: stripe, easypost, tiktok-shop (stub)
├── infra/
│   ├── docker/                 # Dockerfiles
│   ├── nginx/                  # configs de reverse proxy
│   └── deploy/                 # scripts de despliegue al VPS
├── .github/workflows/
└── README.md
```

### 3.3 Patrón clave: catálogo canónico + adaptadores de canal

```
                    ┌─────────────────────────────┐
                    │  Producto canónico (DB)     │
                    │  - SKUs, variantes, stock   │
                    │  - precio base              │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   ┌────▼─────┐              ┌─────▼──────┐             ┌─────▼──────┐
   │ Canal:   │              │ Canal:     │             │ Canal:     │
   │ Web      │              │ TikTok     │             │ (futuro)   │
   │ propio   │              │ Shop API   │             │ eBay/Amazon│
   │ (MVP)    │              │ (fase 2)   │             │            │
   └──────────┘              └────────────┘             └────────────┘
```

Cada canal es un **adaptador** que sabe cómo:
- publicar/sincronizar un producto
- recibir un pedido del canal y normalizarlo al formato interno
- reportar inventario al canal

Esto significa que el código del MVP debe tratar a la web propia como **un canal más** (`channel = "WEB"`), no como "el sistema". Es un detalle de diseño que evita reescribir todo cuando se sume TikTok Shop.

---

## 4. Modelo de datos (Prisma)

Esquema inicial completo. Usa CUIDs como IDs y soft-delete donde aplica.

```prisma
// packages/db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS & AUTH ─────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  phone         String?
  passwordHash  String?
  locale        Locale    @default(EN)
  role          UserRole  @default(BUYER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relaciones
  vendor        Vendor?
  orders        Order[]   @relation("BuyerOrders")
  addresses     Address[]
  cart          Cart?
  sessions      Session[]
  accounts      Account[]
}

enum UserRole {
  BUYER
  VENDOR
  ADMIN
}

enum Locale {
  EN
  ES
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String   // google, credentials
  providerAccountId String
  refreshToken      String?  @db.Text
  accessToken       String?  @db.Text
  expiresAt         Int?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label       String?  // "casa", "oficina"
  fullName    String
  line1       String
  line2       String?
  city        String
  state       String
  postalCode  String
  country     String   @default("US")
  phone       String?
  isDefault   Boolean  @default(false)

  shippingOrders Order[] @relation("ShippingAddress")
  billingOrders  Order[] @relation("BillingAddress")
}

// ─── VENDOR ────────────────────────────────────────────────────

model Vendor {
  id                  String        @id @default(cuid())
  userId              String        @unique
  user                User          @relation(fields: [userId], references: [id])
  storeName           String        @unique
  slug                String        @unique
  bio                 String?       @db.Text
  logoUrl             String?
  bannerUrl           String?
  status              VendorStatus  @default(PENDING)
  rejectionReason     String?

  // Stripe Connect
  stripeAccountId     String?       @unique
  stripeOnboardingDone Boolean      @default(false)
  payoutsEnabled      Boolean       @default(false)
  chargesEnabled      Boolean       @default(false)

  // Identidad / negocio
  businessName        String?
  ein                 String?       // EIN o SSN cifrado en otra tabla idealmente
  taxIdEncrypted      String?       // referencia a vault, no en claro
  businessAddress     Json?

  // Configuración
  shippingMode        ShippingMode  @default(VENDOR_SHIPS)
  commissionPct       Decimal       @default(10.00) @db.Decimal(5, 2) // % default
  acceptsReturns      Boolean       @default(true)

  createdAt           DateTime      @default(now())
  approvedAt          DateTime?
  approvedById        String?

  products            Product[]
  orderItems          OrderItem[]
  payouts             Payout[]
  documents           VendorDocument[]
}

enum VendorStatus {
  PENDING       // recién registrado, falta documentación
  UNDER_REVIEW  // admin revisando
  APPROVED
  REJECTED
  SUSPENDED
}

enum ShippingMode {
  MIPUEBLO_SHIPS  // Mi Pueblo gestiona la logística
  VENDOR_SHIPS    // el vendor envía directo
}

model VendorDocument {
  id        String   @id @default(cuid())
  vendorId  String
  vendor    Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  type      String   // "w9", "id", "license"
  fileUrl   String
  uploadedAt DateTime @default(now())
}

// ─── CATÁLOGO ──────────────────────────────────────────────────

model Category {
  id          String     @id @default(cuid())
  slug        String     @unique
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  nameEn      String
  nameEs      String
  imageUrl    String?
  position    Int        @default(0)
  products    Product[]
}

model Product {
  id            String          @id @default(cuid())
  vendorId      String
  vendor        Vendor          @relation(fields: [vendorId], references: [id])
  categoryId    String?
  category      Category?       @relation(fields: [categoryId], references: [id])

  // Multilingüe
  titleEn       String
  titleEs       String
  slug          String          @unique
  descriptionEn String          @db.Text
  descriptionEs String          @db.Text

  status        ProductStatus   @default(DRAFT)
  basePrice     Decimal         @db.Decimal(10, 2) // referencia, las variantes mandan
  currency      String          @default("USD")

  // Atributos físicos para shipping
  weightOz      Decimal?        @db.Decimal(8, 2)
  lengthIn      Decimal?        @db.Decimal(8, 2)
  widthIn       Decimal?        @db.Decimal(8, 2)
  heightIn      Decimal?        @db.Decimal(8, 2)

  // Tax
  taxCode       String?         // Stripe Tax product code

  // SEO + búsqueda
  searchVector  Unsupported("tsvector")?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  publishedAt   DateTime?

  variants      ProductVariant[]
  media         ProductMedia[]
  channels      ProductChannel[] // por dónde está publicado
  orderItems    OrderItem[]

  @@index([vendorId, status])
  @@index([categoryId])
}

enum ProductStatus {
  DRAFT
  PENDING_REVIEW    // opcional, si admin revisa antes de publicar
  ACTIVE
  PAUSED
  ARCHIVED
}

model ProductVariant {
  id          String    @id @default(cuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku         String    @unique
  // Atributos de variante (talla, color, etc.) como JSON flexible
  attributes  Json      // { "size": "M", "color": "rojo" }
  price       Decimal   @db.Decimal(10, 2)
  compareAtPrice Decimal? @db.Decimal(10, 2)
  stock       Int       @default(0)
  imageUrl    String?
  isDefault   Boolean   @default(false)

  orderItems  OrderItem[]
  reservations StockReservation[]

  @@index([productId])
}

model ProductMedia {
  id          String    @id @default(cuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  type        MediaType
  url         String
  thumbnailUrl String?
  position    Int       @default(0)
  durationSec Int?      // para video
}

enum MediaType {
  IMAGE
  VIDEO
}

model ProductChannel {
  id          String    @id @default(cuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  channel     Channel
  externalId  String?   // ID del producto en el canal externo
  status      String    // ACTIVE, PENDING, ERROR
  lastSyncAt  DateTime?

  @@unique([productId, channel])
}

enum Channel {
  WEB           // shop.mipueblofleamarket.com (MVP)
  TIKTOK_SHOP   // futuro
  EBAY          // futuro
  AMAZON        // futuro
}

// ─── CARRITO Y ORDEN ───────────────────────────────────────────

model Cart {
  id        String     @id @default(cuid())
  userId    String?    @unique // null para carritos invitado
  user      User?      @relation(fields: [userId], references: [id])
  sessionId String?    @unique
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id         String         @id @default(cuid())
  cartId     String
  cart       Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId  String
  variant    ProductVariant @relation(fields: [variantId], references: [id])
  quantity   Int

  @@unique([cartId, variantId])
}

model StockReservation {
  id         String         @id @default(cuid())
  variantId  String
  variant    ProductVariant @relation(fields: [variantId], references: [id])
  quantity   Int
  orderId    String?
  expiresAt  DateTime
  createdAt  DateTime       @default(now())
}

model Order {
  id              String       @id @default(cuid())
  number          String       @unique // human-readable: MP-2026-000123
  buyerId         String
  buyer           User         @relation("BuyerOrders", fields: [buyerId], references: [id])

  status          OrderStatus  @default(PENDING)

  // Direcciones snapshot (no FK directo para preservar histórico)
  shippingAddressId String
  shippingAddress   Address    @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddressId  String
  billingAddress    Address    @relation("BillingAddress", fields: [billingAddressId], references: [id])

  // Totales en cents para evitar floats
  subtotalCents   Int
  shippingCents   Int
  taxCents        Int
  discountCents   Int          @default(0)
  totalCents      Int
  currency        String       @default("USD")

  // Stripe
  stripePaymentIntentId String? @unique
  stripeChargeId        String?
  paidAt                DateTime?

  // Canal de origen
  channel         Channel      @default(WEB)
  externalOrderId String?      // si vino de TikTok Shop, ID original

  notes           String?      @db.Text
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  items           OrderItem[]
  shipments       Shipment[]
  refunds         Refund[]
  ledgerEntries   LedgerEntry[]
}

enum OrderStatus {
  PENDING        // creada, esperando pago
  PAID           // pago capturado
  PROCESSING     // vendor preparando
  SHIPPED        // al menos 1 shipment
  DELIVERED
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
}

model OrderItem {
  id              String          @id @default(cuid())
  orderId         String
  order           Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId       String
  product         Product         @relation(fields: [productId], references: [id])
  variantId       String
  variant         ProductVariant  @relation(fields: [variantId], references: [id])
  vendorId        String
  vendor          Vendor          @relation(fields: [vendorId], references: [id])

  // Snapshot (precios al momento de comprar)
  titleSnapshot   String
  variantSnapshot Json
  unitPriceCents  Int
  quantity        Int
  subtotalCents   Int             // unitPrice * qty
  taxCents        Int             @default(0)
  shippingCents   Int             @default(0) // costo asignado a este item
  commissionCents Int             @default(0) // comisión que retiene la plataforma
  vendorNetCents  Int             // lo que recibe el vendor (subtotal - commission, post-shipping según modelo)

  status          OrderItemStatus @default(PENDING)
  fulfilledAt     DateTime?

  shipmentId      String?
  shipment        Shipment?       @relation(fields: [shipmentId], references: [id])
}

enum OrderItemStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}

// ─── LOGÍSTICA ─────────────────────────────────────────────────

model Shipment {
  id              String         @id @default(cuid())
  orderId         String
  order           Order          @relation(fields: [orderId], references: [id])
  vendorId        String         // qué vendor envía
  carrier         String?        // USPS, UPS, FedEx
  service         String?        // Priority, Ground
  trackingNumber  String?
  trackingUrl     String?
  labelUrl        String?
  costCents       Int?           // costo real al comprar la etiqueta
  shippedAt       DateTime?
  deliveredAt     DateTime?
  status          ShipmentStatus @default(PENDING)
  shippingMode    ShippingMode

  items           OrderItem[]

  // Si Mi Pueblo gestiona, referencia al provider
  easypostShipmentId String?
}

enum ShipmentStatus {
  PENDING
  LABEL_PURCHASED
  IN_TRANSIT
  DELIVERED
  RETURNED
  EXCEPTION
}

// ─── COMISIONES, PAYOUTS, LIBRO MAYOR ──────────────────────────

model LedgerEntry {
  id          String          @id @default(cuid())
  orderId     String?
  order       Order?          @relation(fields: [orderId], references: [id])
  vendorId    String?
  type        LedgerEntryType
  amountCents Int             // positivo = a favor del vendor, negativo = cargo
  description String
  createdAt   DateTime        @default(now())
  payoutId    String?
  payout      Payout?         @relation(fields: [payoutId], references: [id])
}

enum LedgerEntryType {
  SALE              // ingreso bruto del vendor
  COMMISSION        // descuento de comisión
  SHIPPING_COST     // descuento si Mi Pueblo cobró el envío al buyer pero el costo real lo cubre Mi Pueblo
  REFUND            // reembolso al buyer (descuenta del vendor)
  ADJUSTMENT        // manual del admin
  PAYOUT            // transferencia ejecutada
}

model Payout {
  id              String        @id @default(cuid())
  vendorId        String
  vendor          Vendor        @relation(fields: [vendorId], references: [id])
  periodStart     DateTime
  periodEnd       DateTime
  grossCents      Int           // suma de ventas del período
  commissionCents Int
  shippingCents   Int           @default(0)
  refundCents     Int           @default(0)
  netCents        Int           // lo que se transfiere
  currency        String        @default("USD")
  status          PayoutStatus  @default(PENDING)
  stripeTransferId String?
  stripePayoutId   String?
  createdAt       DateTime      @default(now())
  paidAt          DateTime?

  ledgerEntries   LedgerEntry[]
}

enum PayoutStatus {
  PENDING
  IN_TRANSIT
  PAID
  FAILED
}

// ─── REFUNDS ───────────────────────────────────────────────────

model Refund {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  amountCents     Int
  reason          String?
  stripeRefundId  String?  @unique
  status          String   // pending, succeeded, failed
  createdAt       DateTime @default(now())
}

// ─── ADMIN / LOGS ──────────────────────────────────────────────

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String   // "vendor.approved", "product.suspended"
  entityType String
  entityId  String
  payload   Json?
  createdAt DateTime @default(now())

  @@index([entityType, entityId])
}

model Setting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}
```

**Decisiones notables:**
- Todos los montos monetarios en **cents (Int)**, nunca floats.
- `Order.totalCents = subtotal + shipping + tax - discount`. La comisión se calcula a nivel `OrderItem`, no a nivel orden.
- `OrderItem` guarda **snapshots** (título, atributos, precio) para que cambios futuros del producto no rompan el histórico.
- `ProductChannel` permite que un producto exista en varios canales en paralelo desde el inicio.
- `LedgerEntry` da pista de auditoría perfecta para reportes a vendors y SAT/IRS.

---

## 5. Módulos funcionales del MVP

### 5.1 Autenticación y roles

- **Auth.js** con providers: credentials (email+password), Google OAuth, magic link.
- Un solo usuario puede ser **buyer y vendor** simultáneamente; el `role` define la pantalla por defecto pero el JWT lleva ambas capacidades.
- Protección de rutas con middleware Next.js: `/vendor/**` requiere `Vendor.status === APPROVED`; `/admin/**` requiere `role === ADMIN`.
- Rate limiting por IP en login y registro (Redis).
- Reset de password vía email con token de un solo uso (15 min).
- 2FA opcional para admin y vendor (TOTP) — recomendado activar en panel admin.

### 5.2 Onboarding y aprobación de vendors

**Flujo del vendor:**

1. Se registra en `/vendor/signup` (o pasa de buyer a vendor desde su perfil).
2. Completa formulario: nombre de tienda, descripción, idioma, dirección de negocio, modo de envío preferido.
3. Sube documentos (W-9, ID, opcional licencia comercial) → almacenados en R2 con URL firmada.
4. Es redirigido a Stripe Connect Express onboarding (Stripe maneja KYC).
5. Estado pasa a `UNDER_REVIEW`.
6. Admin revisa en `/admin/vendors/pending`. Aprueba o rechaza con motivo.
7. Vendor recibe email; si aprobado, puede empezar a publicar productos.

**Reglas:**
- Hasta no estar `APPROVED` y `payoutsEnabled === true` en Stripe, no puede publicar productos en estado `ACTIVE`.
- Documentos cifrados en reposo. EIN/SSN no en la DB en claro: usar [Stripe's PII storage](https://stripe.com/docs/connect/identity-verification) y guardar solo la referencia.

### 5.3 Catálogo y productos con variantes

Pantalla del vendor `/vendor/products/new`:

1. **Información básica:** título y descripción en es/en (con tab switcher).
2. **Categoría** (árbol jerárquico).
3. **Variantes:** UI estilo Shopify donde el vendor define ejes (talla, color) y el sistema genera la matriz de SKUs. Cada SKU tiene precio, stock e imagen propia.
4. **Medios:** drag-and-drop de fotos (hasta 8) y un video corto (≤ 60s, ≤ 100MB). El worker comprime y genera HLS.
5. **Envío:** peso y dimensiones (necesario para EasyPost). Selección de modo: vendor envía o Mi Pueblo gestiona.
6. **Tax category** (selector reducido: "Apparel", "Electronics", "Food", etc., mapea a códigos de Stripe Tax).
7. **Vista previa** y publicar.

Validación servidor con Zod, rechazo si faltan campos críticos. Si admin tiene activo "review before publish", pasa a `PENDING_REVIEW`; si no, va directo a `ACTIVE`.

### 5.4 Storefront público (estilo TikTok Shop)

Rutas (con prefijo de locale `/es` o `/en`):

- `/` — feed vertical mobile-first: productos en grid 2-col con video autoplay silencioso. Inspiración TikTok pero respetando paleta de Mi Pueblo.
- `/c/[categorySlug]` — categoría.
- `/p/[productSlug]` — página de producto: video grande arriba, carousel de fotos, selector de variantes, "Buy now" sticky abajo.
- `/s/[storeSlug]` — tienda del vendor (perfil + productos).
- `/search?q=...` — full-text search en `searchVector`.
- `/cart`, `/checkout`, `/orders`, `/orders/[id]`.

Mobile-first significa: layout en columna, controles grandes (44px+), bottom-sheet para variantes, pull-to-refresh donde aplica. Desktop es una mejora del mobile, no al revés.

### 5.5 Carrito y checkout

- Carrito persistente: si el usuario está logueado, en DB; si no, cookie + Redis.
- Permite items de **múltiples vendors en una sola compra** (es lo normal en marketplaces).
- Reserva de stock al iniciar checkout (`StockReservation`, expira a los 15 min).
- Cálculo de envío: si todo el carrito es `MIPUEBLO_SHIPS`, una sola tarifa; si hay vendors mixtos, EasyPost calcula por vendor y se suma.
- Cálculo de impuestos: **Stripe Tax** sobre el line-item, basado en dirección de envío.
- Un solo `PaymentIntent` por toda la orden (capture inmediato, no auth+capture diferido).
- Después del cobro:
  - Se crea la `Order` y todos los `OrderItem`.
  - Se splittea contablemente con `LedgerEntry` por vendor.
  - Se notifica a cada vendor (email + dashboard).
  - Si `MIPUEBLO_SHIPS`, se compra etiqueta en EasyPost; si `VENDOR_SHIPS`, el vendor compra/pega su etiqueta y marca shipped.

### 5.6 Pagos: Stripe + Stripe Connect

**Modelo elegido: "Separate charges and transfers"** ([docs](https://stripe.com/docs/connect/separate-charges-and-transfers)).

- La plataforma cobra al buyer en su propia cuenta Stripe (un solo cargo por la orden completa).
- Después, ejecuta `Transfer`s individuales a cada Connected Account de vendor por `vendorNetCents`.
- Esto da control total sobre cuándo pagar y permite retener el dinero hasta que el envío se complete (opcional).

**Por qué no "destination charges":** complican refunds parciales y cuando hay >1 vendor por orden no es viable.

**Flujo del cobro:**

```
1. Cliente confirma checkout
2. Backend: crea PaymentIntent(amount=totalCents, on_behalf_of=null)
3. Cliente confirma con Stripe Elements
4. Webhook payment_intent.succeeded:
     - marca order.PAID
     - genera LedgerEntry(SALE) y LedgerEntry(COMMISSION) por OrderItem
     - encola job "fulfill-order"
5. Job de fulfillment:
     - si MIPUEBLO_SHIPS: compra labels EasyPost
     - notifica vendors
6. Job semanal de payouts (lunes 9am):
     - agrupa LedgerEntry no asignadas por vendor
     - crea Payout
     - ejecuta stripe.transfers.create({ amount, destination: stripeAccountId })
     - actualiza LedgerEntry.payoutId
```

**Refunds:** se procesan vía Stripe (refund parcial o total). El sistema crea `LedgerEntry(REFUND)` negativo que se descuenta del próximo payout del vendor. Si el vendor ya cobró, queda en saldo negativo que se compensa.

### 5.7 Sales tax con Stripe Tax

- Activar Stripe Tax en el dashboard.
- Cada producto tiene un `taxCode` (códigos predefinidos de Stripe).
- En checkout: `tax_calculation` con la dirección del buyer → devuelve `tax_amount_cents` por line item.
- Stripe Tax se encarga de nexus, sales tax holidays, exenciones, reportes para filing.
- **Nota legal:** Mi Pueblo es **marketplace facilitator** según leyes US, lo que la obliga a cobrar tax en nombre de los vendors en la mayoría de estados. Stripe Tax soporta ese modelo.

### 5.8 Logística

**Modo `MIPUEBLO_SHIPS`:**
- En checkout, EasyPost calcula tarifas reales según peso/dim del carrito.
- Mi Pueblo cobra al buyer ese monto + un markup configurable (`Setting.shippingMarkupPct`).
- Tras el pago, se compra la etiqueta automáticamente.
- El item se marca para recolección en el local del vendor (o el vendor lo lleva al hub Mi Pueblo).
- Tracking se sincroniza vía webhook EasyPost.

**Modo `VENDOR_SHIPS`:**
- Vendor define sus propias tarifas (flat o por peso) en su tienda.
- En checkout, esa tarifa se aplica al line item del vendor.
- El vendor recibe el pedido, compra etiqueta donde quiera, marca como `SHIPPED` con tracking number.
- Sin tracking number en X horas → recordatorio automático; X+24h → admin alerta.

### 5.9 Payouts

- **Frecuencia:** semanal (lunes 9am ET por defecto, configurable).
- Se transfieren todos los `LedgerEntry` con `payoutId IS NULL` y orden con `status >= DELIVERED OR createdAt < now() - 7d` (ventana de protección contra reclamos).
- El admin puede ejecutar un payout manual antes del lunes desde `/admin/vendors/[id]/payouts`.
- Si el vendor tiene saldo negativo (refunds > ventas), el payout queda en pausa hasta recuperar saldo positivo.

### 5.10 Panel admin

Rutas y vistas mínimas del MVP:

- `/admin/dashboard` — KPIs: ventas hoy/semana/mes, vendors activos, pedidos pendientes, payouts próximos.
- `/admin/vendors` — lista, filtro por estado, aprobar/rechazar/suspender.
- `/admin/products` — moderación (suspender un producto problemático).
- `/admin/orders` — todas las órdenes, búsqueda, ver detalle, refund manual, cambiar estado.
- `/admin/payouts` — lista de payouts, ejecutar/reintentar.
- `/admin/categories` — CRUD del árbol de categorías.
- `/admin/settings` — comisión global, comisión por categoría/vendor, markup de envío, switches feature flags.
- `/admin/audit-log` — log de acciones de admins.

### 5.11 Panel vendor

- `/vendor/dashboard` — ventas hoy/7d/30d, pedidos pendientes de envío, payouts pendientes, productos top.
- `/vendor/products` — CRUD de productos con bulk edit básico.
- `/vendor/orders` — pedidos a atender (filtro por estado), comprar etiqueta o subir tracking.
- `/vendor/payouts` — historial, próximo payout estimado.
- `/vendor/store` — branding (logo, banner, bio), políticas, modo de envío.
- `/vendor/taxes` — descarga de 1099 al final del año (Stripe Connect lo genera).
- `/vendor/settings` — datos personales, conexión Stripe, documentos.

---

## 6. Internacionalización (es/en)

- **next-intl** con rutas `/[locale]/...`.
- Detección automática por `Accept-Language` y override por usuario logueado (`User.locale`).
- Strings en `apps/web/messages/{es,en}.json`. Fallback a inglés si falta una clave.
- Contenido dinámico (productos) tiene columnas `*En` y `*Es`. UI en panel vendor obliga a llenar ambas para poder publicar (configurable).
- Direcciones, fechas y monedas con `Intl.NumberFormat` / `Intl.DateTimeFormat`.

---

## 7. Búsqueda

**MVP:** Postgres FTS con `tsvector` precomputado y configuración multi-idioma:

```sql
ALTER TABLE "Product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("titleEn",'') || ' ' || coalesce("titleEs",'')), 'A') ||
    setweight(to_tsvector('simple', coalesce("descriptionEn",'') || ' ' || coalesce("descriptionEs",'')), 'B')
  ) STORED;

CREATE INDEX product_search_idx ON "Product" USING GIN ("searchVector");
```

**Fase 2:** migrar a Meilisearch (autohospedado, mismo VPS si recursos alcanzan, o un VPS aparte) cuando haya >50k productos o se necesite typo-tolerance, faceted search rápida y "did you mean".

---

## 8. Seguridad y privacidad

- **TLS** vía Let's Encrypt (certbot) en Nginx.
- **HSTS** y CSP estrictos.
- **CSRF** protegido por Auth.js + same-site cookies.
- **Rate limiting** en endpoints sensibles (login, signup, password reset, checkout) con `@upstash/ratelimit` o `rate-limiter-flexible` sobre Redis.
- **Validación** Zod en todas las entradas.
- **PII**: SSN/EIN nunca en DB en claro; almacenar en Stripe (la fuente legal). En la app guardar solo `last4` para UI.
- **Backups**: Postgres dump diario cifrado a R2 (retención 30 días) + WAL archiving para PITR.
- **Auditoría**: cada acción admin se registra en `AuditLog`.
- **Webhooks** Stripe firmados; verificar siempre `stripe-signature`.
- **Subida de archivos**: signed URLs de R2/S3 con TTL corto, validación MIME y tamaño en cliente y servidor, antivirus opcional (ClamAV) en archivos del vendor (W-9, etc.).
- **Secrets**: nunca en repo. `.env` en VPS con permisos 600. Idealmente Doppler o 1Password CLI en producción.

---

## 9. Performance

- ISR de categorías y productos (revalidate 60s) para que el storefront sea ultra rápido.
- Imágenes con `next/image` + R2/CDN.
- Video corto en HLS adaptativo, lazy load en feed.
- DB índices en todas las FK + `idx(status, vendorId)` en Product.
- Connection pool con PgBouncer si el VPS lo permite.
- Metricas web (LCP, CLS, INP) en PostHog.

---

## 10. Infraestructura — Hostinger VPS

Hostinger ofrece KVM VPS con Ubuntu. Recomendación de plan inicial y plan de escala:

| Etapa | Vendors activos | Plan sugerido | Recursos |
|-------|----------------|---------------|----------|
| Lanzamiento | < 50 | KVM 4 | 4 vCPU / 16GB RAM / 200GB NVMe |
| Crecimiento | 50–300 | KVM 8 | 8 vCPU / 32GB RAM / 400GB NVMe |
| Escala | 300–600+ | Separar servicios en 2–3 VPS o migrar a Cloud (Hetzner, AWS) | — |

**Topología single-VPS (lanzamiento):**

```
VPS Ubuntu 22.04
├── Nginx (reverse proxy + TLS)
├── Next.js (PM2, 2 instancias)
├── Worker (PM2, 1 instancia)
├── PostgreSQL 16
├── Redis 7
└── (opcional) Meilisearch
```

**Setup inicial (resumen, lo expandimos en otro doc al desplegar):**

```bash
# 1. Hardening básico
adduser deploy && usermod -aG sudo deploy
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
# Deshabilitar root SSH y password auth, solo claves

# 2. Stack
apt update && apt install -y nginx postgresql-16 redis-server certbot python3-certbot-nginx
# Node 20 vía nvm o nodesource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pnpm pm2

# 3. Postgres
sudo -u postgres createuser shop --pwprompt
sudo -u postgres createdb shop_prod -O shop

# 4. Deploy
git clone git@github.com:mipueblo/shop-mipueblo.git
cd shop-mipueblo
pnpm install
pnpm build
pm2 start ecosystem.config.js

# 5. Nginx + TLS
# config en /etc/nginx/sites-available/shop.mipueblofleamarket.com
certbot --nginx -d shop.mipueblofleamarket.com
```

**Backups:**
- Cron diario `pg_dump | age -r <key> | rclone copy r2:backups/`
- Snapshot del VPS semanal en el panel Hostinger.

**Observabilidad:**
- Sentry para errores.
- BetterStack/Uptime Robot para uptime ping cada 60s.
- Logs centralizados en `journald`, rotación con logrotate.

---

## 11. Roadmap por fases

Estimación con 1 dev senior fulltime + 1 dev mid fulltime + 1 designer parttime. Ajustable.

### Fase 0 — Cimientos (semana 1-2)

- Repo monorepo, configuración Next.js + Prisma + tRPC + Auth.js + Tailwind + i18n.
- Schema de DB y migraciones iniciales.
- CI/CD básico (lint, type-check, test, build).
- Identidad visual aplicada (paleta de mipueblofleamarket.com, tipografía, componentes shadcn tematizados).
- Setup VPS staging.

### Fase 1 — Vendor onboarding (semana 3-4)

- Registro buyer / vendor.
- Flujo de aprobación de vendor con admin panel mínimo.
- Stripe Connect Express onboarding.
- Subida de documentos a R2.

### Fase 2 — Catálogo (semana 5-7)

- CRUD productos con variantes (matriz de SKUs).
- Subida de imágenes y video corto (worker de transcodificación).
- Categorías y árbol.
- Storefront público: home con feed estilo TikTok, página de producto, página de tienda.

### Fase 3 — Checkout y pagos (semana 8-10)

- Carrito multi-vendor, persistente.
- Checkout con Stripe Elements.
- Stripe Tax.
- Stripe Connect transfers.
- Webhooks y libro mayor.
- Emails transaccionales.

### Fase 4 — Logística (semana 11-12)

- Integración EasyPost.
- Compra de etiquetas (modo Mi Pueblo).
- Vendor-managed shipping con tracking manual.
- Tracking público para el buyer.

### Fase 5 — Payouts y reportes (semana 13)

- Job semanal de payouts.
- Reporte de payouts en panel vendor y admin.
- Refunds.
- 1099 al cierre de año (vía Stripe).

### Fase 6 — Pulido y lanzamiento (semana 14-15)

- QA con vendors piloto (10 vendors).
- Carga de las primeras 200-300 tiendas con onboarding asistido.
- Performance testing.
- Soft launch público.

### Fase 7 — Multicanal (post-lanzamiento)

- Adaptador TikTok Shop API (pull/push de productos, recibir pedidos).
- Adaptador eBay/Amazon si se decide.

---

## 12. Próximos pasos concretos

1. **Confirmar stack y plan** (este doc).
2. **Crear cuenta Stripe US** y solicitar acceso a Stripe Connect + Stripe Tax.
3. **Decidir hosting de medios:** Cloudflare R2 (recomendado por costo) vs S3.
4. **Reservar el VPS Hostinger** una vez confirmes plan KVM 4 u 8.
5. **Compartir paleta y assets de mipueblofleamarket.com** (logo, colores hex, tipografía) para configurar el design system.
6. **Listado piloto:** elegir 10 vendors actuales del flea para usar como beta testers.
7. Empezar **Fase 0 (cimientos)** — yo puedo generar el scaffold del repo en la próxima sesión.

---

## 13. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|------|--------|------------|
| Vendors con bajo nivel digital no completan onboarding | Alta | Alto | Programa de onboarding asistido in-store + videos tutoriales en es/en + soporte WhatsApp |
| Sales tax mal calculado en estados con reglas raras | Media | Alto | Stripe Tax + revisión legal por estado donde Mi Pueblo tenga nexus |
| Refunds que dejan vendor en saldo negativo | Media | Medio | Política de reserva: retener X% del payout primeros 60 días; políticas de devolución claras |
| VPS único = single point of failure | Media | Alto | Snapshots diarios; preparar runbook de recuperación; en fase escala migrar a multi-host |
| Pico de tráfico (campaña) tira el VPS | Baja | Alto | Cloudflare delante; ISR agresivo; plan de upgrade en caliente |
| Vendor publica producto ilegal/falsificación | Media | Alto | Moderación admin + reportes de buyers + suspensión rápida + términos claros |
| Latencia con video corto en planes móviles bajos | Alta | Medio | HLS adaptativo, fallback a poster image si red lenta |

---

## 14. Glosario rápido

- **Marketplace facilitator:** entidad legal que cobra y remite sales tax en nombre de los vendors. Mi Pueblo opera así.
- **Stripe Connect Express:** modalidad donde Stripe maneja el dashboard del vendor y el KYC. La plataforma envía transfers.
- **Separate charges and transfers:** patrón de Stripe Connect donde la plataforma cobra primero y luego transfiere parte a cada vendor.
- **Catálogo canónico:** la fuente única de verdad de productos/inventario. Los canales son adaptadores.
- **ISR (Incremental Static Regeneration):** Next.js sirve páginas estáticas y las regenera en background cada N segundos.

---

*Documento vivo. Próxima revisión tras confirmar VPS y antes de empezar Fase 0.*
