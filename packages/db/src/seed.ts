// ═══════════════════════════════════════════════════════════════════════════
// Seed — shop.mipueblofleamarket.com
// Datos demo: 1 admin, 3 vendors aprobados, 5 categorías raíz + subs, 20 productos
// Correr con: pnpm db:seed
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient, UserRole, VendorStatus, ProductStatus, ShippingMode, Channel, MediaType } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

// Helper: hashear passwords (en producción usar bcrypt — aquí solo para seed)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// Helper: slug
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('🌱 Iniciando seed...\n')

  // ── 1. ADMIN ───────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.mipueblofleamarket.com' },
    update: {},
    create: {
      email: 'admin@shop.mipueblofleamarket.com',
      name: 'Mi Pueblo Admin',
      role: UserRole.ADMIN,
      passwordHash: hashPassword('Admin2026!'),
      emailVerified: new Date(),
      locale: 'ES',
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // ── 2. CATEGORÍAS ──────────────────────────────────────────────────────
  const categories = [
    {
      slug: 'ropa',
      nameEn: 'Clothing',
      nameEs: 'Ropa',
      position: 1,
      sub: [
        { slug: 'ropa-mujer', nameEn: "Women's Clothing", nameEs: 'Ropa de Mujer' },
        { slug: 'ropa-hombre', nameEn: "Men's Clothing", nameEs: 'Ropa de Hombre' },
        { slug: 'ropa-ninos', nameEn: "Children's Clothing", nameEs: 'Ropa de Niños' },
      ],
    },
    {
      slug: 'calzado',
      nameEn: 'Footwear',
      nameEs: 'Calzado',
      position: 2,
      sub: [
        { slug: 'zapatos-mujer', nameEn: "Women's Shoes", nameEs: 'Zapatos de Mujer' },
        { slug: 'zapatos-hombre', nameEn: "Men's Shoes", nameEs: 'Zapatos de Hombre' },
      ],
    },
    {
      slug: 'accesorios',
      nameEn: 'Accessories',
      nameEs: 'Accesorios',
      position: 3,
      sub: [
        { slug: 'joyeria', nameEn: 'Jewelry', nameEs: 'Joyería' },
        { slug: 'bolsas', nameEn: 'Bags & Purses', nameEs: 'Bolsas y Carteras' },
      ],
    },
    {
      slug: 'hogar',
      nameEn: 'Home & Living',
      nameEs: 'Hogar',
      position: 4,
      sub: [
        { slug: 'decoracion', nameEn: 'Decoration', nameEs: 'Decoración' },
        { slug: 'cocina', nameEn: 'Kitchen', nameEs: 'Cocina' },
      ],
    },
    {
      slug: 'electronicos',
      nameEn: 'Electronics',
      nameEs: 'Electrónicos',
      position: 5,
      sub: [
        { slug: 'celulares', nameEn: 'Cell Phones', nameEs: 'Celulares' },
        { slug: 'accesorios-tech', nameEn: 'Tech Accessories', nameEs: 'Accesorios Tech' },
      ],
    },
  ]

  const createdCategories: Record<string, string> = {}

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameEs: cat.nameEs,
        position: cat.position,
      },
    })
    createdCategories[cat.slug] = parent.id

    for (const sub of cat.sub) {
      const child = await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          slug: sub.slug,
          nameEn: sub.nameEn,
          nameEs: sub.nameEs,
          parentId: parent.id,
        },
      })
      createdCategories[sub.slug] = child.id
    }
  }
  console.log(`✅ Categorías: ${Object.keys(createdCategories).length} creadas`)

  // ── 3. VENDORS ─────────────────────────────────────────────────────────
  const vendorData = [
    {
      email: 'maria@demo.mipueblo.com',
      name: 'María García',
      storeName: 'Moda María',
      slug: 'moda-maria',
      bio: 'Ropa de moda para toda la familia a los mejores precios. ¡Te esperamos en Mi Pueblo!',
      shippingMode: ShippingMode.VENDOR_SHIPS,
    },
    {
      email: 'carlos@demo.mipueblo.com',
      name: 'Carlos López',
      storeName: 'TechCarlos',
      slug: 'tech-carlos',
      bio: 'Electrónicos, accesorios y más. Precios de flea market, calidad garantizada.',
      shippingMode: ShippingMode.MIPUEBLO_SHIPS,
    },
    {
      email: 'rosa@demo.mipueblo.com',
      name: 'Rosa Martínez',
      storeName: 'Joyería Rosa',
      slug: 'joyeria-rosa',
      bio: 'Joyería fina y artesanal. Diseños únicos hechos a mano para lucir en cualquier ocasión.',
      shippingMode: ShippingMode.VENDOR_SHIPS,
    },
  ]

  const createdVendors: Array<{ vendorId: string; slug: string; categorySlug: string }> = []

  for (const vd of vendorData) {
    const user = await prisma.user.upsert({
      where: { email: vd.email },
      update: {},
      create: {
        email: vd.email,
        name: vd.name,
        role: UserRole.VENDOR,
        passwordHash: hashPassword('Vendor2026!'),
        emailVerified: new Date(),
        locale: 'ES',
      },
    })

    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        storeName: vd.storeName,
        slug: vd.slug,
        bio: vd.bio,
        status: VendorStatus.APPROVED,
        payoutsEnabled: true,
        chargesEnabled: true,
        stripeOnboardingDone: true,
        shippingMode: vd.shippingMode,
        approvedAt: new Date(),
        approvedById: admin.id,
      },
    })

    const catSlug = vd.slug === 'moda-maria' ? 'ropa' : vd.slug === 'tech-carlos' ? 'electronicos' : 'joyeria'
    createdVendors.push({ vendorId: vendor.id, slug: vd.slug, categorySlug: catSlug })
    console.log(`✅ Vendor: ${vd.storeName} (${vendor.status})`)
  }

  // ── 4. PRODUCTOS ───────────────────────────────────────────────────────
  const productTemplates = [
    // Moda María — Ropa
    {
      vendorIdx: 0,
      titleEn: 'Floral Summer Dress',
      titleEs: 'Vestido Floral de Verano',
      descriptionEn: 'Beautiful floral summer dress, perfect for any occasion. Light fabric, comfortable fit.',
      descriptionEs: 'Hermoso vestido floral de verano, perfecto para cualquier ocasión. Tela ligera y cómodo.',
      basePrice: 29.99,
      categorySlug: 'ropa-mujer',
      taxCode: 'txcd_99999999',
      variants: [
        { size: 'S', color: 'Rosa', price: 29.99, stock: 10 },
        { size: 'M', color: 'Rosa', price: 29.99, stock: 15 },
        { size: 'L', color: 'Rosa', price: 29.99, stock: 8 },
        { size: 'S', color: 'Azul', price: 29.99, stock: 5 },
        { size: 'M', color: 'Azul', price: 29.99, stock: 12 },
      ],
    },
    {
      vendorIdx: 0,
      titleEn: "Men's Guayabera Shirt",
      titleEs: 'Camisa Guayabera para Hombre',
      descriptionEn: 'Traditional guayabera shirt, ideal for warm weather. Available in multiple colors.',
      descriptionEs: 'Camisa guayabera tradicional, ideal para climas cálidos. Disponible en varios colores.',
      basePrice: 24.99,
      categorySlug: 'ropa-hombre',
      taxCode: 'txcd_99999999',
      variants: [
        { size: 'S', color: 'Blanco', price: 24.99, stock: 20 },
        { size: 'M', color: 'Blanco', price: 24.99, stock: 25 },
        { size: 'L', color: 'Blanco', price: 24.99, stock: 15 },
        { size: 'XL', color: 'Blanco', price: 24.99, stock: 10 },
        { size: 'M', color: 'Celeste', price: 24.99, stock: 18 },
      ],
    },
    {
      vendorIdx: 0,
      titleEn: "Children's School Uniform",
      titleEs: 'Uniforme Escolar para Niños',
      descriptionEn: 'Complete school uniform set. Durable and easy to wash. Standard sizing.',
      descriptionEs: 'Set completo de uniforme escolar. Duradero y fácil de lavar. Tallas estándar.',
      basePrice: 19.99,
      categorySlug: 'ropa-ninos',
      taxCode: 'txcd_99999999',
      variants: [
        { size: '4', color: 'Azul Marino', price: 19.99, stock: 30 },
        { size: '6', color: 'Azul Marino', price: 19.99, stock: 25 },
        { size: '8', color: 'Azul Marino', price: 19.99, stock: 20 },
        { size: '10', color: 'Azul Marino', price: 21.99, stock: 15 },
      ],
    },
    {
      vendorIdx: 0,
      titleEn: "Women's Sneakers",
      titleEs: 'Tenis para Mujer',
      descriptionEn: 'Comfortable and stylish sneakers for everyday use. Non-slip sole.',
      descriptionEs: 'Tenis cómodos y elegantes para uso diario. Suela antideslizante.',
      basePrice: 34.99,
      categorySlug: 'zapatos-mujer',
      taxCode: 'txcd_99999999',
      variants: [
        { size: '6', color: 'Blanco', price: 34.99, stock: 8 },
        { size: '7', color: 'Blanco', price: 34.99, stock: 12 },
        { size: '8', color: 'Blanco', price: 34.99, stock: 10 },
        { size: '9', color: 'Blanco', price: 34.99, stock: 6 },
        { size: '7', color: 'Negro', price: 34.99, stock: 9 },
        { size: '8', color: 'Negro', price: 34.99, stock: 11 },
      ],
    },
    {
      vendorIdx: 0,
      titleEn: 'Canvas Tote Bag',
      titleEs: 'Bolsa de Tela Canvas',
      descriptionEn: 'Spacious canvas tote bag with colorful embroidery. Perfect for shopping or beach.',
      descriptionEs: 'Bolsa de tela amplia con bordado colorido. Perfecta para compras o playa.',
      basePrice: 14.99,
      categorySlug: 'bolsas',
      taxCode: 'txcd_99999999',
      variants: [
        { size: 'Único', color: 'Natural', price: 14.99, stock: 50 },
        { size: 'Único', color: 'Negro', price: 14.99, stock: 30 },
      ],
    },
    // TechCarlos — Electrónicos
    {
      vendorIdx: 1,
      titleEn: 'Fast Charging USB-C Cable 6ft',
      titleEs: 'Cable USB-C Carga Rápida 6 pies',
      descriptionEn: 'High-speed USB-C cable, supports up to 65W fast charging. Braided nylon.',
      descriptionEs: 'Cable USB-C de alta velocidad, soporta hasta 65W de carga rápida. Nylon trenzado.',
      basePrice: 9.99,
      categorySlug: 'accesorios-tech',
      taxCode: 'txcd_43396000',
      variants: [
        { size: '6ft', color: 'Negro', price: 9.99, stock: 100 },
        { size: '6ft', color: 'Blanco', price: 9.99, stock: 80 },
        { size: '10ft', color: 'Negro', price: 12.99, stock: 60 },
      ],
    },
    {
      vendorIdx: 1,
      titleEn: 'Wireless Earbuds',
      titleEs: 'Audífonos Inalámbricos',
      descriptionEn: 'True wireless earbuds with noise cancellation. 24-hour battery with case.',
      descriptionEs: 'Audífonos inalámbricos con cancelación de ruido. 24 horas de batería con estuche.',
      basePrice: 39.99,
      categorySlug: 'accesorios-tech',
      taxCode: 'txcd_43396000',
      variants: [
        { size: 'Único', color: 'Negro', price: 39.99, stock: 25 },
        { size: 'Único', color: 'Blanco', price: 39.99, stock: 20 },
      ],
    },
    {
      vendorIdx: 1,
      titleEn: 'Screen Protector for iPhone',
      titleEs: 'Protector de Pantalla para iPhone',
      descriptionEn: 'Tempered glass screen protector, 9H hardness. Compatible with iPhone 14/15.',
      descriptionEs: 'Protector de vidrio templado, dureza 9H. Compatible con iPhone 14/15.',
      basePrice: 7.99,
      categorySlug: 'accesorios-tech',
      taxCode: 'txcd_43396000',
      variants: [
        { size: 'iPhone 14', color: 'Transparente', price: 7.99, stock: 80 },
        { size: 'iPhone 14 Pro', color: 'Transparente', price: 7.99, stock: 70 },
        { size: 'iPhone 15', color: 'Transparente', price: 7.99, stock: 90 },
        { size: 'iPhone 15 Pro', color: 'Transparente', price: 8.99, stock: 65 },
      ],
    },
    {
      vendorIdx: 1,
      titleEn: 'Power Bank 20000mAh',
      titleEs: 'Cargador Portátil 20000mAh',
      descriptionEn: 'High capacity power bank, charges 3 devices simultaneously. LED display.',
      descriptionEs: 'Power bank de alta capacidad, carga 3 dispositivos simultáneamente. Pantalla LED.',
      basePrice: 29.99,
      categorySlug: 'electronicos',
      taxCode: 'txcd_43396000',
      variants: [
        { size: '20000mAh', color: 'Negro', price: 29.99, stock: 35 },
        { size: '20000mAh', color: 'Blanco', price: 29.99, stock: 28 },
      ],
    },
    {
      vendorIdx: 1,
      titleEn: 'Universal Phone Mount for Car',
      titleEs: 'Soporte Universal de Celular para Carro',
      descriptionEn: 'Adjustable magnetic car phone mount for dashboard or windshield.',
      descriptionEs: 'Soporte magnético ajustable para celular en tablero o parabrisas del carro.',
      basePrice: 12.99,
      categorySlug: 'accesorios-tech',
      taxCode: 'txcd_43396000',
      variants: [
        { size: 'Único', color: 'Negro', price: 12.99, stock: 60 },
      ],
    },
    // Joyería Rosa
    {
      vendorIdx: 2,
      titleEn: 'Gold-Plated Hoop Earrings',
      titleEs: 'Aretes de Argolla Bañados en Oro',
      descriptionEn: 'Elegant gold-plated hoop earrings. Hypoallergenic and tarnish-resistant.',
      descriptionEs: 'Elegantes aretes de argolla bañados en oro. Hipoalergénicos y resistentes al roce.',
      basePrice: 18.99,
      categorySlug: 'joyeria',
      taxCode: 'txcd_99999999',
      variants: [
        { size: 'Pequeño (20mm)', color: 'Dorado', price: 18.99, stock: 40 },
        { size: 'Mediano (30mm)', color: 'Dorado', price: 22.99, stock: 35 },
        { size: 'Grande (40mm)', color: 'Dorado', price: 26.99, stock: 20 },
      ],
    },
    {
      vendorIdx: 2,
      titleEn: 'Silver Charm Bracelet',
      titleEs: 'Pulsera de Plata con Dijes',
      descriptionEn: 'Sterling silver charm bracelet with 5 assorted charms. Adjustable length.',
      descriptionEs: 'Pulsera de plata esterlina con 5 dijes variados. Largo ajustable.',
      basePrice: 34.99,
      categorySlug: 'joyeria',
      taxCode: 'txcd_99999999',
      variants: [
        { size: 'Ajustable', color: 'Plata', price: 34.99, stock: 25 },
        { size: 'Ajustable', color: 'Dorado Rosado', price: 34.99, stock: 20 },
      ],
    },
    {
      vendorIdx: 2,
      titleEn: 'Natural Stone Necklace',
      titleEs: 'Collar de Piedras Naturales',
      descriptionEn: 'Handmade necklace with genuine semi-precious stones. Each piece is unique.',
      descriptionEs: 'Collar artesanal con piedras semipreciosas genuinas. Cada pieza es única.',
      basePrice: 45.00,
      categorySlug: 'joyeria',
      taxCode: 'txcd_99999999',
      variants: [
        { size: '18"', color: 'Amatista', price: 45.00, stock: 8 },
        { size: '18"', color: 'Turquesa', price: 45.00, stock: 6 },
        { size: '18"', color: 'Ojo de Tigre', price: 45.00, stock: 10 },
        { size: '20"', color: 'Amatista', price: 49.00, stock: 5 },
      ],
    },
    {
      vendorIdx: 2,
      titleEn: 'Men\'s Steel Bracelet',
      titleEs: 'Pulsera de Acero para Hombre',
      descriptionEn: 'Masculine stainless steel bracelet with magnetic clasp. Durable and stylish.',
      descriptionEs: 'Pulsera masculina de acero inoxidable con cierre magnético. Duradera y elegante.',
      basePrice: 22.99,
      categorySlug: 'joyeria',
      taxCode: 'txcd_99999999',
      variants: [
        { size: '8"', color: 'Plata', price: 22.99, stock: 30 },
        { size: '8.5"', color: 'Plata', price: 22.99, stock: 25 },
        { size: '8"', color: 'Negro/Plata', price: 24.99, stock: 20 },
      ],
    },
    {
      vendorIdx: 2,
      titleEn: 'Resin Art Earrings',
      titleEs: 'Aretes de Arte en Resina',
      descriptionEn: 'Handmade resin earrings with dried flower inclusions. Lightweight and unique.',
      descriptionEs: 'Aretes artesanales de resina con flores secas incluidas. Ligeros y únicos.',
      basePrice: 16.99,
      categorySlug: 'joyeria',
      taxCode: 'txcd_99999999',
      variants: [
        { size: 'Único', color: 'Rosa/Dorado', price: 16.99, stock: 15 },
        { size: 'Único', color: 'Azul/Plata', price: 16.99, stock: 12 },
        { size: 'Único', color: 'Verde/Dorado', price: 16.99, stock: 10 },
      ],
    },
  ]

  let productCount = 0
  let variantCount = 0

  for (const tmpl of productTemplates) {
    const vendor = createdVendors[tmpl.vendorIdx]
    if (!vendor) continue

    const categoryId = createdCategories[tmpl.categorySlug]
    const slug = `${toSlug(tmpl.titleEs)}-${vendor.slug}`

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        vendorId: vendor.vendorId,
        categoryId: categoryId ?? null,
        titleEn: tmpl.titleEn,
        titleEs: tmpl.titleEs,
        slug,
        descriptionEn: tmpl.descriptionEn,
        descriptionEs: tmpl.descriptionEs,
        status: ProductStatus.ACTIVE,
        basePrice: tmpl.basePrice,
        taxCode: tmpl.taxCode,
        publishedAt: new Date(),
        weightOz: 8,
        lengthIn: 10,
        widthIn: 8,
        heightIn: 3,
      },
    })

    // Canal WEB desde el día 1
    await prisma.productChannel.upsert({
      where: { productId_channel: { productId: product.id, channel: Channel.WEB } },
      update: {},
      create: {
        productId: product.id,
        channel: Channel.WEB,
        status: 'ACTIVE',
        lastSyncAt: new Date(),
      },
    })

    // Media placeholder
    await prisma.productMedia.upsert({
      where: { id: `media-${product.id}-1` },
      update: {},
      create: {
        id: `media-${product.id}-1`,
        productId: product.id,
        type: MediaType.IMAGE,
        url: `https://placehold.co/800x800/f08f0a/ffffff?text=${encodeURIComponent(tmpl.titleEs)}`,
        thumbnailUrl: `https://placehold.co/400x400/f08f0a/ffffff?text=${encodeURIComponent(tmpl.titleEs)}`,
        position: 0,
      },
    })

    // Variantes
    for (let i = 0; i < tmpl.variants.length; i++) {
      const v = tmpl.variants[i]!
      const sku = `${vendor.slug.toUpperCase()}-${toSlug(tmpl.titleEs).toUpperCase().slice(0, 8)}-${toSlug(v.size)}-${toSlug(v.color)}`.slice(0, 50)

      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          sku,
          attributes: { size: v.size, color: v.color },
          price: v.price,
          stock: v.stock,
          isDefault: i === 0,
        },
      })
      variantCount++
    }

    productCount++
  }

  console.log(`✅ Productos: ${productCount} creados con ${variantCount} variantes`)

  // ── 5. DEMO BUYER ─────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'buyer@demo.mipueblo.com' },
    update: {},
    create: {
      email: 'buyer@demo.mipueblo.com',
      name: 'Ana Comprador Demo',
      role: UserRole.BUYER,
      passwordHash: hashPassword('Buyer2026!'),
      emailVerified: new Date(),
      locale: 'ES',
    },
  })
  console.log(`✅ Buyer demo creado`)

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\nCredenciales de acceso:')
  console.log('  Admin:  admin@shop.mipueblofleamarket.com / Admin2026!')
  console.log('  Vendor: maria@demo.mipueblo.com / Vendor2026!')
  console.log('  Vendor: carlos@demo.mipueblo.com / Vendor2026!')
  console.log('  Vendor: rosa@demo.mipueblo.com / Vendor2026!')
  console.log('  Buyer:  buyer@demo.mipueblo.com / Buyer2026!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
