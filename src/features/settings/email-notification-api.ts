import { api, type ApiSuccess } from '@/lib/api'

export type EmailNotificationRow = {
  id: number
  module: string
  type: string
  action: string
  status: string
  permissions: string
  value: string
}

export type EmailNotificationSettingsPayload = {
  modules: Record<string, EmailNotificationRow[]>
  is_superadmin: boolean
}

export async function getEmailNotificationSettings(): Promise<EmailNotificationSettingsPayload> {
  const { data } = await api.get<ApiSuccess<EmailNotificationSettingsPayload>>(
    '/email-notification-settings',
  )
  return data.data
}

export async function updateEmailNotificationSettings(
  mailNoti: Record<string, 'on' | 'off'>,
): Promise<EmailNotificationSettingsPayload> {
  const { data } = await api.put<ApiSuccess<EmailNotificationSettingsPayload>>(
    '/email-notification-settings',
    { mail_noti: mailNoti },
  )
  return data.data
}
