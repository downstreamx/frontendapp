import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type LandingSettings = {
  id: number
  company_name?: string
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  config_sections?: Record<string, unknown>
}

export type CustomPage = {
  id: number
  title: string
  slug: string
  content: string
  meta_title?: string
  meta_description?: string
  is_active?: boolean
  is_disabled?: boolean
  created_at?: string
  updated_at?: string
}

export type CustomPagesIndexMeta = {
  active_options: Array<{ value: string; label: string }>
}

export async function getLandingSettings() {
  const { data } = await api.get<ApiSuccess<LandingSettings>>('/landing-page/settings/current')
  return data.data
}

export async function updateLandingSettings(payload: Partial<LandingSettings>) {
  const { data } = await api.put<ApiSuccess<LandingSettings>>('/landing-page/settings/current', payload)
  return data.data
}

export async function fetchCustomPagesIndexMeta() {
  const { data } = await api.get<ApiSuccess<CustomPagesIndexMeta>>('/landing-page/pages/index-meta')
  return data.data
}

export async function listCustomPagesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<CustomPage>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/landing-page/pages', { params })
  return extractPaginatedList<CustomPage>(data)
}

export async function getCustomPage(id: number) {
  const { data } = await api.get<ApiSuccess<CustomPage>>(`/landing-page/pages/${id}`)
  return data.data
}

export async function createCustomPage(payload: {
  title: string
  slug?: string
  content: string
  meta_title?: string
  meta_description?: string
  is_active?: boolean
}) {
  const { data } = await api.post<ApiSuccess<CustomPage>>('/landing-page/pages', payload)
  return data.data
}

export async function updateCustomPage(
  id: number,
  payload: Partial<{
    title: string
    slug: string
    content: string
    meta_title: string
    meta_description: string
    is_active: boolean
  }>,
) {
  const { data } = await api.put<ApiSuccess<CustomPage>>(`/landing-page/pages/${id}`, payload)
  return data.data
}

export async function deleteCustomPage(id: number) {
  await api.delete(`/landing-page/pages/${id}`)
}
