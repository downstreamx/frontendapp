import { api, type ApiSuccess } from '@/lib/api'
import type { PaymentReminderSchedule } from '@/features/_shared/components/PaymentReminderScheduleCard'

export type SupplierPaymentReminderSettings = PaymentReminderSchedule & {
  company_reminders_enabled: boolean
}

export async function getSupplierPaymentReminderSettings(
  supplierId: string | number,
): Promise<SupplierPaymentReminderSettings> {
  const res = await api.get<ApiSuccess<SupplierPaymentReminderSettings>>(
    `/account/suppliers/${supplierId}/payment-reminder-settings`,
  )
  return res.data.data
}

export async function updateSupplierPaymentReminderSettings(
  supplierId: string | number,
  payload: PaymentReminderSchedule,
): Promise<SupplierPaymentReminderSettings> {
  const res = await api.put<ApiSuccess<SupplierPaymentReminderSettings>>(
    `/account/suppliers/${supplierId}/payment-reminder-settings`,
    payload,
  )
  return res.data.data
}
