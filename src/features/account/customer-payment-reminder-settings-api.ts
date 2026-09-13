import { api, type ApiSuccess } from '@/lib/api'
import type { PaymentReminderSchedule } from '@/features/_shared/components/PaymentReminderScheduleCard'

export type CustomerPaymentReminderSettings = PaymentReminderSchedule & {
  company_reminders_enabled: boolean
}

export async function getCustomerPaymentReminderSettings(
  customerId: string | number,
): Promise<CustomerPaymentReminderSettings> {
  const res = await api.get<ApiSuccess<CustomerPaymentReminderSettings>>(
    `/account/customers/${customerId}/payment-reminder-settings`,
  )
  return res.data.data
}

export async function updateCustomerPaymentReminderSettings(
  customerId: string | number,
  payload: PaymentReminderSchedule,
): Promise<CustomerPaymentReminderSettings> {
  const res = await api.put<ApiSuccess<CustomerPaymentReminderSettings>>(
    `/account/customers/${customerId}/payment-reminder-settings`,
    payload,
  )
  return res.data.data
}
