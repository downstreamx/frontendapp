import { api, type ApiSuccess } from '@/lib/api'

export type ActionableNotificationItem = {
  key: string
  label: string
  count: number
  href: string
  severity: 'warning' | 'info' | 'error'
}

export type ActionableNotificationsPayload = {
  items: ActionableNotificationItem[]
  total_count: number
}

export async function fetchActionableNotifications(): Promise<ActionableNotificationsPayload> {
  const { data } = await api.get<ApiSuccess<ActionableNotificationsPayload>>(
    '/notifications/actionable',
  )
  return data.data
}
