import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type AccountTypeOption = {
  id: number
  name: string
  code?: string
  normal_balance?: string
}

export type ParentAccountOption = {
  id: number
  account_code: string
  account_name: string
}

export type ChartOfAccount = {
  id: number
  account_code: string
  account_name: string
  account_type_id: number
  parent_account_id?: number | null
  level?: number
  normal_balance: string
  opening_balance?: number | string
  current_balance?: number | string
  is_active?: boolean
  is_system_account?: boolean
  description?: string | null
  account_type?: AccountTypeOption
  parent_account?: ParentAccountOption
}

export type ChartOfAccountInput = {
  account_code: string
  account_name: string
  account_type_id: number
  normal_balance: 'debit' | 'credit'
  opening_balance?: number
  current_balance?: number
  is_active?: boolean
  description?: string
  parent_account_id?: number | null
  level?: number
}

export type ChartOfAccountUpdateInput = ChartOfAccountInput

export type ChartOfAccountIndexMeta = {
  account_types: AccountTypeOption[]
  parent_accounts: ParentAccountOption[]
}

const base = '/account/chart-of-accounts'

export async function listChartOfAccountsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<ChartOfAccount>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<ChartOfAccount>(data)
}

export async function listChartOfAccounts(params?: Record<string, string>) {
  const result = await listChartOfAccountsPaginated({ per_page: '100', ...params })
  return result.rows
}

export async function getChartOfAccountIndexMeta(): Promise<ChartOfAccountIndexMeta> {
  const { data } = await api.get<ApiSuccess<ChartOfAccountIndexMeta>>(`${base}/index-meta`)
  return data.data
}

export async function getChartOfAccountCreateMeta(): Promise<ChartOfAccountIndexMeta> {
  const { data } = await api.get<ApiSuccess<ChartOfAccountIndexMeta>>(`${base}/create-meta`)
  return data.data
}

export async function getChartOfAccount(id: number): Promise<ChartOfAccount> {
  const { data } = await api.get<ApiSuccess<ChartOfAccount>>(`${base}/${id}`)
  return data.data
}

export async function createChartOfAccount(input: ChartOfAccountInput): Promise<ChartOfAccount> {
  const { data } = await api.post<ApiSuccess<ChartOfAccount>>(base, input)
  return data.data
}

export async function updateChartOfAccount(
  id: number,
  input: ChartOfAccountUpdateInput,
): Promise<ChartOfAccount> {
  const { data } = await api.put<ApiSuccess<ChartOfAccount>>(`${base}/${id}`, input)
  return data.data
}

export async function deleteChartOfAccount(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}
