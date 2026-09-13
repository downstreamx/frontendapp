import { api, type ApiSuccess } from '@/lib/api'

export type NotificationSeverity = 'info' | 'warning' | 'critical'

export type InboxNotification = {
  id: number
  action: string
  category: string
  severity: NotificationSeverity
  title: string
  body: string | null
  href: string
  meta: Record<string, unknown>
  read_at: string | null
  is_read: boolean
  created_at: string | null
}

export type ActionableNotificationItem = {
  key: string
  label: string
  count: number
  href: string
  severity: NotificationSeverity
}

export type NotificationFeedPayload = {
  unread_count: number
  action_items: ActionableNotificationItem[]
  action_total: number
  notifications: InboxNotification[]
}

export async function fetchNotificationFeed(limit = 25): Promise<NotificationFeedPayload> {
  const { data } = await api.get<ApiSuccess<NotificationFeedPayload>>('/notifications/feed', {
    params: { limit },
  })
  return data.data
}

export async function markNotificationsRead(options?: {
  ids?: number[]
  all?: boolean
}): Promise<{ updated: number }> {
  const { data } = await api.post<ApiSuccess<{ updated: number }>>('/notifications/mark-read', {
    ids: options?.ids,
    all: options?.all ?? false,
  })
  return data.data
}
