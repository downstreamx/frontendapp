import { api, type ApiSuccess } from '@/lib/api'
import type { SalesLineItemSettings } from '@/features/commercial/line-item-settings-types'

export type SalesCommercialLineItemSettings = SalesLineItemSettings

export async function getSalesCommercialLineItemSettings(): Promise<SalesCommercialLineItemSettings> {
  const res = await api.get<ApiSuccess<SalesCommercialLineItemSettings>>(
    '/sales/commercial-line-item-settings',
  )
  return res.data.data
}

export async function updateSalesCommercialLineItemSettings(
  payload: SalesCommercialLineItemSettings,
): Promise<SalesCommercialLineItemSettings> {
  const res = await api.put<ApiSuccess<SalesCommercialLineItemSettings>>(
    '/sales/commercial-line-item-settings',
    payload,
  )
  return res.data.data
}
