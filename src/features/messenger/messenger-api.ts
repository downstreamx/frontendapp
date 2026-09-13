import { api, type ApiSuccess } from '@/lib/api'

export type MessengerUser = {
  id: number
  name: string
  email: string
  avatar?: string | null
  avatar_url?: string | null
}

export type MessengerContact = MessengerUser & {
  is_online: boolean
  unread_count: number
  is_favorite: boolean
  is_pinned: boolean
  last_message: MessengerMessage | null
}

export type MessengerMessage = {
  id: number
  from_id: number
  to_id: number
  body: string
  attachment?: string | null
  attachment_url?: string | null
  seen: boolean
  created_at?: string
  updated_at?: string
  is_mine?: boolean
  from_user?: MessengerUser | null
  to_user?: MessengerUser | null
}

export type MessengerMessagesPage = {
  data: MessengerMessage[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  has_more: boolean
}

export type MessengerNewMessagesCheck = {
  has_new_messages: boolean
  new_messages_count: number
  timestamp: string
}

export async function fetchMessengerStatus() {
  const { data } = await api.get<
    ApiSuccess<{ module: string; status: string; pusher?: { key?: string; cluster?: string } }>
  >('/messenger/status')
  return data.data
}

export async function listMessengerContacts() {
  const { data } = await api.get<ApiSuccess<MessengerContact[]>>('/messenger/contacts')
  return data.data
}

export async function listMessengerMessages(
  withUserId: number,
  page = 1,
): Promise<MessengerMessagesPage> {
  const { data } = await api.get<ApiSuccess<MessengerMessagesPage>>('/messenger/messages', {
    params: { with_user_id: withUserId, page, per_page: 50 },
  })
  return data.data
}

export async function sendMessengerMessage(payload: {
  to_id: number
  body?: string
  attachment?: File | null
}) {
  const form = new FormData()
  form.append('to_id', String(payload.to_id))
  if (payload.body?.trim()) {
    form.append('body', payload.body.trim())
  }
  if (payload.attachment) {
    form.append('attachment', payload.attachment)
  }
  const { data } = await api.post<ApiSuccess<MessengerMessage>>('/messenger/messages', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function editMessengerMessage(messageId: number, body: string) {
  const { data } = await api.put<ApiSuccess<MessengerMessage>>(
    `/messenger/messages/${messageId}`,
    { body },
  )
  return data.data
}

export async function deleteMessengerMessage(messageId: number) {
  await api.delete(`/messenger/messages/${messageId}`)
}

export async function toggleMessengerFavorite(userId: number) {
  const { data } = await api.post<ApiSuccess<{ is_favorite: boolean }>>(
    '/messenger/favorites/toggle',
    { user_id: userId },
  )
  return data.data.is_favorite
}

export async function toggleMessengerPin(userId: number) {
  const { data } = await api.post<ApiSuccess<{ is_pinned: boolean }>>(
    '/messenger/pinned/toggle',
    { user_id: userId },
  )
  return data.data.is_pinned
}

export async function checkMessengerNewMessages(lastCheck?: string) {
  const { data } = await api.get<ApiSuccess<MessengerNewMessagesCheck>>(
    '/messenger/messages/check-new',
    { params: lastCheck ? { last_check: lastCheck } : undefined },
  )
  return data.data
}

export async function updateMessengerPresence() {
  await api.post('/messenger/presence')
}

export async function setMessengerOffline() {
  await api.post('/messenger/presence/offline')
}
