import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type FinanceCategory = {
  id: number
  category_name: string
  category_code: string
  description?: string | null
  is_active: boolean
  gl_account_id?: number | null
  gl_account?: { id: number; account_code: string; account_name: string } | null
}

export type FinanceCategoryInput = {
  category_name: string
  category_code: string
  gl_account_id?: number | null
  description?: string
  is_active?: boolean
}

export type FinanceCategoryMeta = {
  chart_of_accounts: Array<{ id: number; account_code: string; account_name: string }>
}

export type FinanceCategoryKind = 'revenue' | 'expense'

function basePath(kind: FinanceCategoryKind): string {
  return kind === 'revenue' ? '/account/revenue-categories' : '/account/expense-categories'
}

export async function listFinanceCategoriesPaginated(
  kind: FinanceCategoryKind,
  params?: Record<string, string>,
): Promise<PaginatedListResult<FinanceCategory>> {
  const { data } = await api.get<ApiSuccess<unknown>>(basePath(kind), { params })
  return extractPaginatedList<FinanceCategory>(data)
}

export async function getFinanceCategoryCreateMeta(
  kind: FinanceCategoryKind,
): Promise<FinanceCategoryMeta> {
  const { data } = await api.get<ApiSuccess<FinanceCategoryMeta>>(`${basePath(kind)}/create-meta`)
  return data.data
}

export async function createFinanceCategory(
  kind: FinanceCategoryKind,
  input: FinanceCategoryInput,
): Promise<FinanceCategory> {
  const { data } = await api.post<ApiSuccess<FinanceCategory>>(basePath(kind), input)
  return data.data
}

export async function updateFinanceCategory(
  kind: FinanceCategoryKind,
  id: number,
  input: FinanceCategoryInput,
): Promise<FinanceCategory> {
  const { data } = await api.put<ApiSuccess<FinanceCategory>>(`${basePath(kind)}/${id}`, input)
  return data.data
}

export async function deleteFinanceCategory(kind: FinanceCategoryKind, id: number): Promise<void> {
  await api.delete(`${basePath(kind)}/${id}`)
}
