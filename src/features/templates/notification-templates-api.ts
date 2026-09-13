import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type NotificationTemplateRow = {
  id: number
  module: string
  action: string
  type: string
  status: string
  permissions?: string
  languages?: Array<{ id: number; lang: string }>
}

export type NotificationTemplateIndexMeta = {
  types: string[]
  languages: Array<{ code: string; name: string }>
}

export type NotificationTemplateEditPayload = {
  template: NotificationTemplateRow
  lang: string
  content: {
    lang: string
    subject: string
    content: string
    variables: Record<string, string>
    persisted?: boolean
  }
  languages: Array<{ code: string; name: string }>
}

export async function fetchNotificationTemplatesIndexMeta() {
  const { data } = await api.get<ApiSuccess<NotificationTemplateIndexMeta>>(
    '/notification-templates/index-meta',
  )
  return data.data
}

export async function listNotificationTemplatesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<NotificationTemplateRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/notification-templates', { params })
  return extractPaginatedList<NotificationTemplateRow>(data)
}

export async function fetchNotificationTemplateForEdit(id: number, lang: string) {
  const { data } = await api.get<ApiSuccess<NotificationTemplateEditPayload>>(
    `/notification-templates/${id}`,
    { params: { lang } },
  )
  return data.data
}

export async function fetchNotificationTemplateLanguage(id: number, lang: string) {
  const { data } = await api.get<
    ApiSuccess<{
      lang: string
      subject: string
      content: string
      variables: Record<string, string>
      persisted?: boolean
    }>
  >(`/notification-templates/${id}/languages/${lang}`)
  return data.data
}

export async function updateNotificationTemplateContent(
  id: number,
  payload: { lang: string; content: string },
) {
  const { data } = await api.put<
    ApiSuccess<{
      lang: string
      subject: string
      content: string
      variables: Record<string, string>
    }>
  >(`/notification-templates/${id}`, payload)
  return data.data
}
