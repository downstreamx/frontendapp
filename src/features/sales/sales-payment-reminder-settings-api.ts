import { api, type ApiSuccess } from '@/lib/api'

export type SalesPaymentReminderSettings = {
  enabled: boolean
  advance_days: number[]
  send_on_due_date: boolean
}

export async function getSalesPaymentReminderSettings(): Promise<SalesPaymentReminderSettings> {
  const res = await api.get<ApiSuccess<SalesPaymentReminderSettings>>(
    '/sales/payment-reminder-settings',
  )
  return res.data.data
}

export async function updateSalesPaymentReminderSettings(
  payload: SalesPaymentReminderSettings,
): Promise<SalesPaymentReminderSettings> {
  const res = await api.put<ApiSuccess<SalesPaymentReminderSettings>>(
    '/sales/payment-reminder-settings',
    payload,
  )
  return res.data.data
}
