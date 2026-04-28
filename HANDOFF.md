# HANDOFF — shop.mipueblofleamarket.com

> **Documento de traspaso del proyecto.** Léelo completo antes de continuar. Está escrito para que cualquier otra IA o desarrollador pueda retomar el trabajo sin perder contexto.

**Última actualización:** 28 de abril de 2026
**Estado general:** Fase de planificación completada. Repo conectado a GitHub. Listo para arrancar Fase 0 (scaffold del monorepo).

---

## 1. Contexto del proyecto

### 1.1 Qué es

`shop.mipueblofleamarket.com` es un **marketplace multi-vendor propio** para Mi Pueblo Flea Market. Es la plataforma de e-commerce de la empresa, no una integración con eBay/Amazon/TikTok — esos solo son referencias visuales y de modelo de negocio.

- **Dueño del proyecto:** Mi Pueblo Flea Market (Henry Anchante, henryanchantec@gmail.com)
- **Dominio:** `shop.mipueblofleamarket.com`
- **Marca paraguas:** `mipueblofleamarket.com`
- **Escala objetivo:** 600+ vendors activos del flea market
- **Mercado:** US (principalmente comunidad hispana)
- **Idiomas:** español + inglés desde el día 1

### 1.2 Modelo de negocio

- **Marketplace facilitator** estilo Amazon/eBay simplificado.
- Buyer paga **una sola vez** (producto + impuesto + envío) por checkout.
- Plataforma cobra con **Stripe**, calcula sales tax con **Stripe Tax**, retiene **comisión** y costos logísticos.
- Net se distribuye a cada vendor con **Stripe Connect Express** en **payouts semanales automáticos**.
- Dos modelos logísticos coexisten:
  - `MIPUEBLO_SHIPS` — Mi Pueblo gestiona el envío (etiquetas con EasyPost).
  - `VENDOR_SHIPS` — el vendor envía directo y sube tracking manualmente.
- Inspiración visual: **TikTok Shop** (feed vertical, video corto en producto), pero con la identidad de Mi Pueblo.
- **Mobile-first**, web responsive, sin apps nativas en MVP.

### 1.3 Lo que NO está en el MVP

Live shopping, programa de afiliados, chat en tiempo real, ads manager, recomendaciones AI personalizadas. Quedan como hooks futuros — la arquitectura está lista pero no se implementan.

---

## 2. Stack técnico confirmado

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 14 (App Router)** + TypeScript estricto |
| API | **tRPC** + Zod |
| ORM | **Prisma** |
| DB | **PostgreSQL 16** |
| Auth | **Auth.js (NextAuth)** multi-rol (BUYER / VENDOR / ADMIN) |
| UI | **Tailwind CSS** + **shadcn/ui** |
| Estado cliente | **Zustand** + **TanStack Query** |
| i18n | **next-intl** (rutas `/es` y `/en`) |
| Cache + colas | **Redis** + **BullMQ** |
| Búsqueda | Postgres FTS (MVP) → Meilisearch (fase 2) |
| Pagos | **Stripe** + **Stripe Connect (Express)** |
| Impuestos | **Stripe Tax** |
| Logística | **EasyPost** |
| Storage | **Cloudflare R2** + CDN |
| Procesamiento medios | **sharp** (imágenes) + **ffmpeg** (HLS para video) |
| Email | **Resend** + React Email |
| Monitoring | **Sentry** + BetterStack |
| Analytics | **PostHog** self-hosted |
| Hosting | **VPS Hostinger Ubuntu 22.04** (plan KVM 4 → KVM 8 según escala) |
| CI/CD | **GitHub Actions** |
| Monorepo | **pnpm workspaces** |

**Decisión clave:** patrón Stripe Connect **"separate charges and transfers"** — la plataforma cobra al buyer en su cuenta Stripe, después transfiere a cada Connected Account. Permite refunds parciales y órdenes multi-vendor.

**Decisión clave 2:** catálogo canónico con tabla `ProductChannel` desde el día 1. Hoy solo `WEB`, mañana `TIKTOK_SHOP`, `EBAY`, `AMAZON` se conectan como adaptadores sin reescribir nada.

---

## 3. Estado del repositorio

### 3.1 Repo y rutas

- **Repo GitHub (privado):** https://github.com/henryia/shop.mipueblofleamarket.com
- **Carpeta local en laptop Windows:** `C:\Mi Pueblo Flea Market\shop\Shop.mipueblofleamarket.com`
- **Carpeta montada en Cowork (Linux):** `/sessions/jolly-charming-galileo/mnt/Shop.mipueblofleamarket.com/`
- **Branch principal:** `main`
- **Último commit:** `25915e0 chore: merge initial repo state with arquitectura, README y gitignore`

### 3.2 Archivos actuales en el repo

```
shop.mipueblofleamarket.com/
├── .gitattributes              # auto-generado por GitHub
├── .gitignore                  # configurado para Next.js + pnpm + Prisma
├── ARQUITECTURA-Y-PLAN-MVP.md  # blueprint técnico completo (~45KB)
├── HANDOFF.md                  # este documento
└── README.md                   # resumen del proyecto
```

**El código del proyecto (apps/, packages/, infra/) AÚN NO EXISTE.** Es lo que generaremos en Fase 0.

### 3.3 Modelo de colaboración con IA

- **La carpeta del proyecto está montada en Cowork**, así que la IA puede crear/editar archivos directamente con `Write`/`Edit` y aparecen instantáneamente en el laptop de Henry.
- **Henry hace commit + push manualmente** desde su laptop tras cada cambio:
  ```powershell
  cd "C:\Mi Pueblo Flea Market\shop\Shop.mipueblofleamarket.com"
  git status
  git add .
  git commit -m "mensaje descriptivo"
  git push
  ```
- **NO hay GitHub MCP disponible** en el registry de Cowork — verificado por búsqueda en abril 2026.
- **Plan futuro:** cuando arranque la programación pesada, instalar **Claude Code** localmente para automatizar el ciclo Git con `gh auth login` ya configurado.

### 3.4 Git en la laptop

- Git está instalado en Windows (versión Git for Windows).
- `user.name` = "Henry"
- `user.email` = "henryanchantec@gmail.com"
- `init.defaultBranch` = "main"
- Credentials guardadas vía Git Credential Manager (login con cuenta `henryia`).

---

## 4. Documento de arquitectura

El archivo **`ARQUITECTURA-Y-PLAN-MVP.md`** contiene el blueprint completo en 14 secciones:

1. Resumen ejecutivo
2. Stack técnico detallado
3. Arquitectura del sistema con diagramas
4. **Modelo de datos completo en Prisma** (~25 modelos, listos para copy-paste)
5. Módulos funcionales del MVP (auth, vendor onboarding, catálogo, carrito, checkout, Stripe, tax, logística, payouts, admin, vendor panel)
6. Internacionalización
7. Búsqueda
8. Seguridad y privacidad
9. Performance
10. Infraestructura Hostinger
11. **Roadmap por fases** (15 semanas)
12. Próximos pasos concretos
13. Riesgos y mitigaciones
14. Glosario

**Cualquier IA que continúe debe leer ese documento completo antes de generar código.** Es la fuente única de verdad para decisiones técnicas.

---

## 5. Plan de tareas — estado actual

### 5.1 Tareas completadas ✅

| # | Tarea |
|---|-------|
| — | Documento de arquitectura y plan MVP |
| — | README.md y .gitignore del repo |
| — | Instalación de Git en Windows |
| — | Inicialización del repo local + push a GitHub |
| 23 | Modelo de trabajo Cowork ↔ GitHub definido |

### 5.2 Tareas pendientes que dependen de Henry (bloqueantes externos)

| # | Tarea | Notas |
|---|-------|-------|
| 1 | Confirmar VPS Hostinger | Plan KVM 4 (4 vCPU / 16GB RAM / 200GB NVMe). DNS de `shop.mipueblofleamarket.com` apuntando al IP del VPS. Henry compartirá acceso por canal seguro fuera de Cowork. |
| 2 | Crear cuentas de servicios externos | Stripe US + activar Connect Express + Stripe Tax (review tarda 2–7 días, **arrancar YA**). Cloudflare (DNS + R2). EasyPost. Resend o AWS SES. Sentry. |
| 3 | Recolectar identidad visual de Mi Pueblo | Logo SVG, paleta de colores hex de mipueblofleamarket.com, tipografía. Necesario para configurar el design system de Tailwind/shadcn. |

### 5.3 Tareas que la IA puede ejecutar (no bloqueadas por VPS/Stripe)

Estas se pueden empezar AHORA en la carpeta montada, sin esperar nada externo:

| # | Tarea | Descripción |
|---|-------|-------------|
| **4** | **Fase 0 — Scaffold del monorepo** | Crear estructura `apps/web`, `apps/worker`, `packages/db`, `packages/api`, `packages/ui`, `packages/config`, `packages/integrations`. Configs base: `package.json` workspace, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.editorconfig`, `.prettierrc`, ESLint flat config, Tailwind preset, `docker-compose.yml` con Postgres+Redis, `.env.example` con todas las vars. |
| **5** | **Fase 0 — Migraciones Prisma + seed** | Schema completo del documento de arquitectura (§4). Migraciones iniciales. Seed con: 1 admin, 3 vendors demo aprobados, 5 categorías raíz con subcategorías, 20 productos con variantes (talla/color), media placeholder. |
| **6** | **Fase 0 — CI/CD GitHub Actions** | `.github/workflows/ci.yml` con lint + type-check + test + build en PR. `.github/workflows/deploy.yml` con deploy SSH a VPS staging en push a `main` (queda con secrets vacíos hasta que llegue el VPS). |

### 5.4 Tareas de fases siguientes (en orden)

| # | Tarea | Bloqueada por |
|---|-------|---------------|
| 7 | Auth multi-rol (buyer/vendor/admin) con Auth.js | #4, #5 |
| 8 | Onboarding y aprobación de vendors + Stripe Connect Express | #2 (Stripe activo), #7 |
| 9 | CRUD de productos con variantes (matriz SKUs) | #7 |
| 10 | Subida y procesamiento de medios (sharp + ffmpeg HLS) | #2 (R2), #9 |
| 11 | Storefront público estilo TikTok (feed, producto, tienda, búsqueda) | #9, #10 |
| 12 | Carrito multi-vendor + checkout con Stripe Elements + Stripe Tax | #2 (Stripe), #11 |
| 13 | Stripe Connect transfers + libro mayor + refunds | #12 |
| 14 | Emails transaccionales bilingües (Resend + React Email) | #2 (Resend) |
| 15 | Logística EasyPost (rate shopping, label purchase, tracking webhook) | #2 (EasyPost), #12 |
| 16 | Job de payouts semanales (BullMQ cron, Stripe transfers) | #13 |
| 17 | Panel admin completo + panel vendor completo | #8, #9, #12, #13 |
| 18 | Hardening: CSP, rate limiting, backups, Sentry, k6 load tests | todas las anteriores |
| 19 | Beta cerrada con 10 vendors piloto | #18 |
| 20 | Soft launch público (200–300 vendors) | #19 |
| 21 | Integrar IA Claude en operación (traducción es↔en, moderación, asistente vendor, búsqueda semántica, soporte 24/7, resúmenes dashboard) | post-#20 |
| 22 | Adaptador TikTok Shop API (canal `TIKTOK_SHOP`) | post-#20 |

---

## 6. Decisiones tomadas (no reabrir)

1. **Stack:** Next.js + Node + PostgreSQL + Prisma. Descartados Laravel y Medusa.js por razones detalladas en §2.2 del documento de arquitectura.
2. **Hosting:** VPS Hostinger (no shared hosting, no Vercel para MVP por costos a 600+ vendors).
3. **Patrón Stripe Connect:** "separate charges and transfers" (no "destination charges" — incompatible con multi-vendor + refunds).
4. **Sales tax:** Stripe Tax (no TaxJar separado).
5. **Logística:** EasyPost (no Shippo, decisión por API simple y multi-courier).
6. **Storage:** Cloudflare R2 (no S3, decisión por costo de egress = $0).
7. **Modelo de trabajo IA ↔ Git:** manual hasta arrancar Fase 0; después migrar a Claude Code local.
8. **Idiomas MVP:** español + inglés solamente. Otros idiomas son fase futura.

---

## 7. Decisiones pendientes

| Tema | Estado | Quién decide |
|------|--------|--------------|
| Plan exacto de Hostinger (KVM 4 vs 8 al lanzamiento) | KVM 4 propuesto, Henry confirma al contratar | Henry |
| Resend vs AWS SES para email | Resend recomendado por DX; Henry decide al crear cuenta | Henry |
| Comisión por defecto del marketplace (% retenido a vendor) | Sugerido 10% en schema; Henry define el real (puede variar por categoría) | Henry |
| Código tax por categoría (mapping a códigos Stripe Tax) | Pendiente, se hace junto con setup de categorías | Henry + IA |
| Política de devoluciones (ventana, quién paga shipping de retorno) | Pendiente | Henry |
| Markup sobre costos de envío en modo MIPUEBLO_SHIPS | Pendiente, configurable en `Setting` | Henry |
| Frecuencia de payouts (semanal por defecto, o quincenal/mensual) | Semanal propuesto | Henry |
| Política de retención (¿retener X% primeros 60 días para protección refunds?) | Recomendado, valor pendiente | Henry |

---

## 8. Cómo continuar — instrucciones para la próxima IA

### 8.1 Antes de hacer cualquier cosa

1. **Lee este documento completo.**
2. **Lee `ARQUITECTURA-Y-PLAN-MVP.md` completo.** Es la fuente única de verdad técnica.
3. **Revisa el estado actual del repo** ejecutando bash en `/sessions/.../mnt/Shop.mipueblofleamarket.com/` y haz `ls -la` para ver qué archivos ya existen. Si encuentras `apps/`, `packages/`, etc., significa que Fase 0 ya está parcialmente generada — no la rehagas, continúa donde quedó.
4. **Pregunta a Henry el estado de las tareas externas** (#1 VPS, #2 Stripe, #3 identidad visual). Eso desbloquea o no las siguientes fases.

### 8.2 Workflow operativo

- **Crear/editar archivos:** usa `Write` y `Edit` directamente sobre rutas en `C:\Mi Pueblo Flea Market\shop\Shop.mipueblofleamarket.com\...`. Aparecen instantáneamente en la laptop de Henry.
- **Verificar:** usa `mcp__workspace__bash` con la ruta Linux `/sessions/jolly-charming-galileo/mnt/Shop.mipueblofleamarket.com/`. Útil para `ls`, validar configs, etc.
- **Después de cada bloque significativo de archivos**, recordar a Henry que haga commit + push:
  ```powershell
  cd "C:\Mi Pueblo Flea Market\shop\Shop.mipueblofleamarket.com"
  git add .
  git commit -m "feat: ..."
  git push
  ```
- **No correr `git` desde la IA** a menos que Henry configure un PAT explícitamente (no lo ha hecho).

### 8.3 Próximo paso recomendado

**Fase 0 — Scaffold del monorepo** (tareas #4, #5, #6). Es lo más eficiente porque:
- No depende de VPS ni Stripe.
- Avanza el proyecto mientras se desbloquean las cuentas externas.
- Al llegar el VPS, ya tienes código listo para deploy.

Generar en este orden:
1. Configs raíz (`package.json` workspace, `pnpm-workspace.yaml`, `tsconfig.base.json`, ESLint, Prettier, EditorConfig).
2. `docker-compose.yml` (Postgres + Redis local).
3. `.env.example` con todas las variables del documento de arquitectura.
4. `packages/db/` con schema Prisma completo + migración inicial + seed script.
5. `apps/web/` con Next.js 14, App Router, Tailwind, shadcn baseline, next-intl, layout raíz bilingüe.
6. `apps/worker/` con BullMQ stub.
7. `packages/api/` con tRPC server stub.
8. `packages/ui/` con componentes shadcn iniciales.
9. `.github/workflows/ci.yml`.

### 8.4 Restricciones importantes

- **NO instalar dependencias desde la IA.** El `pnpm install` lo corre Henry en su laptop. Solo generamos los `package.json` correctos.
- **NO incluir secretos reales en archivos.** Todo va en `.env.example` con valores placeholder. El `.env` real lo crea Henry.
- **NO crear nuevos archivos `.md` de docs sin pedirlo Henry.** Solo actualizar los existentes (este HANDOFF, README, ARQUITECTURA).
- **Respetar mobile-first**: todos los componentes y layouts deben verse bien primero en 360px de ancho.
- **Bilingüismo desde el primer componente:** ningún string hardcoded en inglés o español; siempre vía `useTranslations()` de `next-intl`.

---

## 9. Recursos del ecosistema Claude planeados

Estos son los recursos del ecosistema Claude que se aprovecharán en distintas fases. **Algunos ya están activos en Cowork, otros se activarán más adelante.**

| Recurso | Cuándo se activa | Para qué |
|---------|------------------|----------|
| **Cowork (este entorno)** | Activo | Planificación, edición de archivos en folder montado, TaskList, documentos vivos |
| **TodoList / TaskTracking** | Activo | Seguimiento de las 23 tareas |
| **Skills (docx, pptx, xlsx, pdf)** | Activos | Contratos vendor, T&C, manuales onboarding, reportes financieros, presentaciones |
| **Cowork Artifacts** | Disponible, no usado aún | Dashboards persistentes (status vendors pendientes, payouts semanales, KPIs) |
| **Scheduled Tasks** | Disponible, no usado aún | Reportes automáticos lunes 9am (estado del marketplace) |
| **Claude Code (CLI)** | Pendiente — Henry lo instala al arrancar Fase 0 pesada | Desarrollo agéntic en repo, PRs, refactors grandes, deploys SSH al VPS |
| **Claude API (Agent SDK)** | Tarea #21, post-launch | Traducción es↔en automática de productos, moderación de catálogo, asistente vendor con foto→título, búsqueda semántica, soporte 24/7, resúmenes inteligentes en dashboard |
| **MCP connectors** | Según se necesiten | Sentry MCP (debug en producción), Stripe MCP si aparece, Linear si Henry usa |

---

## 10. Datos de contacto y referencias rápidas

- **Henry Anchante** — fundador / dueño del proyecto. Email: henryanchantec@gmail.com. Usuario GitHub: `henryia`.
- **Repo:** https://github.com/henryia/shop.mipueblofleamarket.com
- **Sitio actual de la empresa:** https://mipueblofleamarket.com (referencia visual)
- **Producción objetivo:** https://shop.mipueblofleamarket.com
- **Documento técnico:** `ARQUITECTURA-Y-PLAN-MVP.md` (en este repo)

---

## 11. Resumen de una línea para arrancar

> Marketplace multi-vendor de Mi Pueblo Flea Market en Next.js + Prisma + Stripe Connect, repo conectado, arquitectura definida, listo para arrancar Fase 0 (scaffold del monorepo) sin esperar VPS ni Stripe.

---

*Este documento debe actualizarse al cierre de cada fase. Si modificas algo material del proyecto, actualiza también este HANDOFF.*
