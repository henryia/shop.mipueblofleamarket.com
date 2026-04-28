-- ═══════════════════════════════════════════════════════════════════════════
-- Migración inicial — shop.mipueblofleamarket.com
-- Generada el 2026-04-28
-- ═══════════════════════════════════════════════════════════════════════════

-- Enums
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'VENDOR', 'ADMIN');
CREATE TYPE "Locale" AS ENUM ('EN', 'ES');
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ShippingMode" AS ENUM ('MIPUEBLO_SHIPS', 'VENDOR_SHIPS');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "Channel" AS ENUM ('WEB', 'TIKTOK_SHOP', 'EBAY', 'AMAZON');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'LABEL_PURCHASED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'EXCEPTION');
CREATE TYPE "LedgerEntryType" AS ENUM ('SALE', 'COMMISSION', 'SHIPPING_COST', 'REFUND', 'ADJUSTMENT', 'PAYOUT');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'PAID', 'FAILED');

-- Tablas
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'EN',
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "fullName" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "stripeAccountId" TEXT,
    "stripeOnboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "businessName" TEXT,
    "taxIdEncrypted" TEXT,
    "businessAddress" JSONB,
    "shippingMode" "ShippingMode" NOT NULL DEFAULT 'VENDOR_SHIPS',
    "commissionPct" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "acceptsReturns" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");
CREATE UNIQUE INDEX "Vendor_storeName_key" ON "Vendor"("storeName");
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");
CREATE UNIQUE INDEX "Vendor_stripeAccountId_key" ON "Vendor"("stripeAccountId");

CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleEs" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionEs" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "weightOz" DECIMAL(8,2),
    "lengthIn" DECIMAL(8,2),
    "widthIn" DECIMAL(8,2),
    "heightIn" DECIMAL(8,2),
    "taxCode" TEXT,
    "searchVector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_vendorId_status_idx" ON "Product"("vendorId", "status");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_search_idx" ON "Product" USING GIN ("searchVector");

-- Trigger para actualizar searchVector automáticamente
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."titleEn", '') || ' ' || coalesce(NEW."titleEs", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."descriptionEn", '') || ' ' || coalesce(NEW."descriptionEs", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_vector_update
BEFORE INSERT OR UPDATE OF "titleEn", "titleEs", "descriptionEn", "descriptionEs"
ON "Product"
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER,
    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductChannel" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    CONSTRAINT "ProductChannel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductChannel_productId_channel_key" ON "ProductChannel"("productId", "channel");

CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart"("sessionId");

CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shippingAddressId" TEXT NOT NULL,
    "billingAddressId" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "channel" "Channel" NOT NULL DEFAULT 'WEB',
    "externalOrderId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "variantSnapshot" JSONB NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "vendorNetCents" INTEGER NOT NULL,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "fulfilledAt" TIMESTAMP(3),
    "shipmentId" TEXT,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "carrier" TEXT,
    "service" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "labelUrl" TEXT,
    "costCents" INTEGER,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippingMode" "ShippingMode" NOT NULL,
    "easypostShipmentId" TEXT,
    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "vendorId" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payoutId" TEXT,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "refundCents" INTEGER NOT NULL DEFAULT 0,
    "netCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "stripeTransferId" TEXT,
    "stripePayoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT,
    "stripeRefundId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Foreign Keys
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductChannel" ADD CONSTRAINT "ProductChannel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON UPDATE CASCADE;

-- Settings iniciales del sistema
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES
  ('platform.commissionPct',     '10',    NOW()),
  ('platform.payoutHoldDays',    '7',     NOW()),
  ('platform.shippingMarkupPct', '15',    NOW()),
  ('platform.payoutSchedule',    '"WEEKLY_MONDAY"', NOW()),
  ('platform.reviewBeforePublish', 'false', NOW()),
  ('platform.maxImageSizeMb',    '10',    NOW()),
  ('platform.maxVideoSizeMb',    '100',   NOW());
