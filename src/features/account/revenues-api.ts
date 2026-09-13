import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type RevenueCategoryOption = {
  id: number
  category_name: string
  category_code?: string
}

export type RevenueBankAccountOption = {
  id: number
  account_name: string
  account_number?: string
}

export type RevenueChartOfAccountOption = {
  id: number
  account_code: string
  account_name: string
}

export type Revenue = {
  id: number
  revenue_number?: string
  revenue_date: string
  category_id?: number
  bank_account_id?: number
  chart_of_account_id?: number | null
  amount: number | string
  status: string
  description?: string | null
  reference_number?: string | null
  approved_by?: number | null
  category?: RevenueCategoryOption
  bank_account?: RevenueBankAccountOption
  chart_of_account?: RevenueChartOfAccountOption
  approved_by_user?: { id: number; name: string }
}

export type RevenueInput = {
  revenue_date: string
  category_id: number
  bank_account_id: number
  chart_of_account_id?: number | null
  amount: number
  description?: string
  reference_number?: string
}

export type RevenueIndexMeta = {
  categories: RevenueCategoryOption[]
  bank_accounts: RevenueBankAccountOption[]
  chart_of_accounts: RevenueChartOfAccountOption[]
}

const base = '/account/revenues'

export async function listRevenuesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<Revenue>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<Revenue>(data)
}

export async function listRevenues(params?: Record<string, string>) {
  const result = await listRevenuesPaginated({ per_page: '100', ...params })
  return result.rows
}

export async function getRevenueIndexMeta(): Promise<RevenueIndexMeta> {
  const { data } = await api.get<ApiSuccess<RevenueIndexMeta>>(`${base}/index-meta`)
  return data.data
}

export async function getRevenueCreateMeta(): Promise<RevenueIndexMeta> {
  const { data } = await api.get<ApiSuccess<RevenueIndexMeta>>(`${base}/create-meta`)
  return data.data
}

export async function getRevenue(id: number): Promise<Revenue> {
  const { data } = await api.get<ApiSuccess<Revenue>>(`${base}/${id}`)
  return data.data
}

export async function createRevenue(input: RevenueInput): Promise<Revenue> {
  const { data } = await api.post<ApiSuccess<Revenue>>(base, input)
  return data.data
}

export async function updateRevenue(id: number, input: RevenueInput): Promise<Revenue> {
  const { data } = await api.put<ApiSuccess<Revenue>>(`${base}/${id}`, input)
  return data.data
}

export async function deleteRevenue(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}

export async function approveRevenue(id: number): Promise<Revenue> {
  const { data } = await api.post<ApiSuccess<Revenue>>(`${base}/${id}/approve`)
  return data.data
}

export async function postRevenue(id: number): Promise<Revenue> {
  const { data } = await api.post<ApiSuccess<Revenue>>(`${base}/${id}/post`)
  return data.data
}
