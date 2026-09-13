import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type HelpdeskMeta = {
  categories: Array<{ id: number; name: string; color?: string }>
  statuses: string[]
  priorities: string[]
  companies?: Array<{ id: number; name: string }>
  platform_context?: boolean
}

export type HelpdeskTicketListRow = {
  id: number
  ticket_id?: string
  title: string
  status?: string
  priority?: string
  category?: { id: number; name: string }
  creator?: { id: number; name: string }
  created_by?: number
}

export async function fetchHelpdeskMeta() {
  const { data } = await api.get<ApiSuccess<HelpdeskMeta>>('/helpdesk/create-meta')
  return data.data
}

export async function listHelpdeskCategories() {
  const { data } = await api.get<ApiSuccess<unknown>>('/helpdesk/categories')
  return extractListRows<{ id: number; name: string; description?: string; color?: string }>(data)
}

export async function createHelpdeskCategory(payload: {
  name: string
  description?: string
  color?: string
}) {
  const { data } = await api.post<ApiSuccess<{ id: number; name: string }>>('/helpdesk/categories', payload)
  return data.data
}

export async function getHelpdeskCategory(id: number) {
  const { data } = await api.get<ApiSuccess<{ id: number; name: string; description?: string; color?: string }>>(
    `/helpdesk/categories/${id}`,
  )
  return data.data
}

export async function updateHelpdeskCategory(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<{ id: number; name: string }>>(`/helpdesk/categories/${id}`, payload)
  return data.data
}

export async function deleteHelpdeskCategory(id: number) {
  await api.delete(`/helpdesk/categories/${id}`)
}

export async function listHelpdeskTicketsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<HelpdeskTicketListRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/helpdesk/tickets', { params })
  return extractPaginatedList<HelpdeskTicketListRow>(data)
}

export async function createHelpdeskTicket(payload: {
  title: string
  description: string
  category_id?: number
  priority?: string
  company_id?: number
}) {
  const { data } = await api.post<ApiSuccess<{ id: number; title: string }>>('/helpdesk/tickets', payload)
  return data.data
}

export async function getHelpdeskTicket(id: string | number) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(`/helpdesk/tickets/${id}`)
  return data.data
}

export async function updateHelpdeskTicket(
  id: string | number,
  payload: { status?: string; priority?: string; title?: string; description?: string; category_id?: number },
) {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(`/helpdesk/tickets/${id}`, payload)
  return data.data
}

export async function deleteHelpdeskTicket(id: string | number) {
  await api.delete(`/helpdesk/tickets/${id}`)
}

export async function replyToHelpdeskTicket(
  id: string | number,
  payload: { message: string; attachments?: string[]; is_internal?: boolean },
) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(`/helpdesk/tickets/${id}/replies`, payload)
  return data.data
}
