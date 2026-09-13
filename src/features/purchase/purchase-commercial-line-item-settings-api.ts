import { api, type ApiSuccess } from '@/lib/api'
import type { PurchaseLineItemSettings } from '@/features/commercial/line-item-settings-types'

export type PurchaseCommercialLineItemSettings = PurchaseLineItemSettings

export async function getPurchaseCommercialLineItemSettings(): Promise<PurchaseCommercialLineItemSettings> {
  const res = await api.get<ApiSuccess<PurchaseCommercialLineItemSettings>>(
    '/procurement/commercial-line-item-settings',
  )
  return res.data.data
}

export async function updatePurchaseCommercialLineItemSettings(
  payload: PurchaseCommercialLineItemSettings,
): Promise<PurchaseCommercialLineItemSettings> {
  const res = await api.put<ApiSuccess<PurchaseCommercialLineItemSettings>>(
    '/procurement/commercial-line-item-settings',
    payload,
  )
  return res.data.data
}
