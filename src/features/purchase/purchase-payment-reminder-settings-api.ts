import { api, type ApiSuccess } from '@/lib/api'

export type PurchasePaymentReminderSettings = {
  enabled: boolean
  advance_days: number[]
  send_on_due_date: boolean
}

export async function getPurchasePaymentReminderSettings(): Promise<PurchasePaymentReminderSettings> {
  const res = await api.get<ApiSuccess<PurchasePaymentReminderSettings>>(
    '/procurement/payment-reminder-settings',
  )
  return res.data.data
}

export async function updatePurchasePaymentReminderSettings(
  payload: PurchasePaymentReminderSettings,
): Promise<PurchasePaymentReminderSettings> {
  const res = await api.put<ApiSuccess<PurchasePaymentReminderSettings>>(
    '/procurement/payment-reminder-settings',
    payload,
  )
  return res.data.data
}
