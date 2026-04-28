// ─── Adapter EasyPost (logística) ─────────────────────────────────────────
// Multi-courier: USPS, UPS, FedEx
// Modos: MIPUEBLO_SHIPS (plataforma compra etiqueta) y VENDOR_SHIPS (tracking manual)

// EasyPost no tiene SDK oficial con tipos TS en v5, usamos fetch directo
const EASYPOST_API_URL = 'https://api.easypost.com/v2'
const API_KEY = process.env.EASYPOST_API_KEY ?? ''

async function easypostRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${EASYPOST_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const err = (await res.json()) as { error: { message: string } }
    throw new Error(`EasyPost error: ${err.error?.message ?? res.statusText}`)
  }

  return res.json() as Promise<T>
}

// ── Interfaces mínimas ─────────────────────────────────────────────────────
interface EasyPostAddress {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
}

interface EasyPostParcel {
  weight: number  // oz
  length: number  // inches
  width: number
  height: number
}

interface EasyPostRate {
  id: string
  carrier: string
  service: string
  rate: string
  delivery_days: number | null
}

interface EasyPostShipment {
  id: string
  rates: EasyPostRate[]
  postage_label?: { label_url: string }
  tracking_code?: string
  tracker?: { public_url: string }
}

// ── Rate shopping ──────────────────────────────────────────────────────────
export async function getRates(params: {
  from: EasyPostAddress
  to: EasyPostAddress
  parcel: EasyPostParcel
}) {
  const shipment = await easypostRequest<EasyPostShipment>('POST', '/shipments', {
    shipment: {
      from_address: params.from,
      to_address: params.to,
      parcel: params.parcel,
    },
  })

  return {
    shipmentId: shipment.id,
    rates: shipment.rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)),
  }
}

// ── Comprar etiqueta ───────────────────────────────────────────────────────
export async function purchaseLabel(shipmentId: string, rateId: string) {
  const shipment = await easypostRequest<EasyPostShipment>('POST', `/shipments/${shipmentId}/buy`, {
    rate: { id: rateId },
  })

  return {
    trackingNumber: shipment.tracking_code ?? '',
    trackingUrl: shipment.tracker?.public_url ?? '',
    labelUrl: shipment.postage_label?.label_url ?? '',
  }
}

// TODO Fase 4: webhook handler para tracking updates
// El webhook EasyPost llama a POST /api/webhooks/easypost con eventos de tracking
