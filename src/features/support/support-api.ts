import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type SupportTicketListItem = {
  id: number
  subject: string
  status?: string
  ticket_id?: string
  tcategory?: { id: number; name: string }
}

export type KnowledgeBaseRow = {
  id: number
  title: string
  description?: string
  category?: string
}

export type FaqRow = {
  id: number
  title: string
  description?: string
}

export type SupportMeta = {
  categories: Array<{ id: number; name: string; color?: string }>
  users: Array<{ id: number; name: string; email?: string }>
  statuses: string[]
}

export type SupportBrandSettings = {
  logo_dark: string
  favicon: string
  title_text: string
  footer_text: string
}

export type SupportInformationSettings = {
  response_time: string
  opening_hours: string
  closing_hours: string
  phone_support: string
}

export async function listSupportTickets() {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/tickets')
  return extractListRows<SupportTicketListItem>(data)
}

export async function listSupportTicketsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<SupportTicketListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/tickets', { params })
  return extractPaginatedList<SupportTicketListItem>(data)
}

export async function fetchSupportTicketsIndexMeta(): Promise<SupportMeta> {
  const { data } = await api.get<ApiSuccess<SupportMeta>>('/support-ticket/tickets/index-meta')
  return data.data
}

export async function fetchSupportMeta(): Promise<SupportMeta> {
  const { data } = await api.get<ApiSuccess<SupportMeta>>('/support-ticket/create-meta')
  return data.data
}

export async function createSupportTicket(payload: {
  subject: string
  description: string
  category?: number
}) {
  const { data } = await api.post<ApiSuccess<SupportTicketListItem>>('/support-ticket/tickets', payload)
  return data.data
}

export async function getSupportTicket(id: string | number) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(`/support-ticket/tickets/${id}`)
  return data.data
}

export async function replyToSupportTicket(id: string | number, description: string) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/support-ticket/tickets/${id}/replies`, { description })
  return data.data
}

export async function updateSupportTicket(
  id: string | number,
  payload: { status?: string; user_id?: number | null; category?: number | null },
) {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(`/support-ticket/tickets/${id}`, payload)
  return data.data
}

export async function listKnowledgeBasesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<KnowledgeBaseRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/knowledge-bases', { params })
  return extractPaginatedList<KnowledgeBaseRow>(data)
}

export async function listKnowledgeBases() {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/knowledge-bases')
  return extractListRows<KnowledgeBaseRow>(data)
}

export async function getKnowledgeBase(id: number) {
  const { data } = await api.get<ApiSuccess<KnowledgeBaseRow>>(`/support-ticket/knowledge-bases/${id}`)
  return data.data
}

export async function createKnowledgeBase(payload: { title: string; description: string; category?: string }) {
  const { data } = await api.post<ApiSuccess<KnowledgeBaseRow>>('/support-ticket/knowledge-bases', payload)
  return data.data
}

export async function updateKnowledgeBase(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<KnowledgeBaseRow>>(`/support-ticket/knowledge-bases/${id}`, payload)
  return data.data
}

export async function deleteKnowledgeBase(id: number) {
  await api.delete(`/support-ticket/knowledge-bases/${id}`)
}

export async function listFaqsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<FaqRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/faqs', { params })
  return extractPaginatedList<FaqRow>(data)
}

export async function listFaqs() {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/faqs')
  return extractListRows<FaqRow>(data)
}

export async function getFaq(id: number) {
  const { data } = await api.get<ApiSuccess<FaqRow>>(`/support-ticket/faqs/${id}`)
  return data.data
}

export async function createFaq(payload: { title: string; description: string }) {
  const { data } = await api.post<ApiSuccess<FaqRow>>('/support-ticket/faqs', payload)
  return data.data
}

export async function updateFaq(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<FaqRow>>(`/support-ticket/faqs/${id}`, payload)
  return data.data
}

export async function deleteFaq(id: number) {
  await api.delete(`/support-ticket/faqs/${id}`)
}

export type SupportSettingsSection =
  | 'brand'
  | 'support-information'
  | 'title-sections'
  | 'cta-sections'
  | 'contact-information'

export async function fetchSupportPortalSettings<T>(section: SupportSettingsSection) {
  const { data } = await api.get<ApiSuccess<T>>(`/support-ticket/settings/${section}`)
  return data.data
}

export async function updateSupportPortalSettings<T>(
  section: SupportSettingsSection,
  payload: Record<string, unknown>,
) {
  const { data } = await api.put<ApiSuccess<T>>(`/support-ticket/settings/${section}`, payload)
  return data.data
}

export async function listSupportContacts() {
  const { data } = await api.get<ApiSuccess<unknown>>('/support-ticket/contacts')
  return extractListRows<{ id: number; name?: string; email: string; subject: string }>(data)
}

export async function createSupportContact(payload: {
  first_name: string
  last_name: string
  email: string
  subject: string
  message: string
}) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>('/support-ticket/contacts', payload)
  return data.data
}
