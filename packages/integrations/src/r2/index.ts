// ─── Adapter Cloudflare R2 (S3-compatible) ────────────────────────────────
// Storage de imágenes, videos y documentos de vendors
// Decisión: R2 sobre S3 por costo de egress $0 (HANDOFF §6)

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

const BUCKET = process.env.R2_BUCKET_NAME ?? 'shop-media'
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

// ── Generar URL firmada para upload directo desde el cliente ──────────────
// 🧠 Nota educativa Claude: este patrón evita que el archivo pase por nuestro
//    servidor — el cliente sube directo a R2, más eficiente y barato.
export async function getUploadUrl(params: {
  key: string
  contentType: string
  maxSizeBytes?: number
  expiresIn?: number  // segundos
}) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  })

  const url = await getSignedUrl(r2Client, command, {
    expiresIn: params.expiresIn ?? 300, // 5 minutos
  })

  return {
    uploadUrl: url,
    publicUrl: `${PUBLIC_URL}/${params.key}`,
  }
}

// ── Eliminar archivo ───────────────────────────────────────────────────────
export async function deleteFile(key: string) {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// ── Helpers de keys ───────────────────────────────────────────────────────
export function productImageKey(vendorId: string, productId: string, filename: string) {
  return `products/${vendorId}/${productId}/images/${filename}`
}

export function productVideoKey(vendorId: string, productId: string, filename: string) {
  return `products/${vendorId}/${productId}/video/${filename}`
}

export function vendorDocumentKey(vendorId: string, docType: string, filename: string) {
  return `vendors/${vendorId}/documents/${docType}/${filename}`
}

export function vendorLogoKey(vendorId: string, filename: string) {
  return `vendors/${vendorId}/logo/${filename}`
}
