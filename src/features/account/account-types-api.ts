import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type AccountCategoryOption = {
  id: number
  name: string
  code?: string
}

export type AccountTypeRow = {
  id: number
  category_id: number
  name: string
  code: string
  normal_balance: 'debit' | 'credit'
  description?: string | null
  is_active: boolean
  is_system_type: boolean
  category?: AccountCategoryOption
}

export type AccountTypeCreateMeta = {
  account_categories: AccountCategoryOption[]
}

export async function listAccountTypesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<AccountTypeRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/account/account-types', { params })
  return extractPaginatedList<AccountTypeRow>(data)
}

export async function fetchAccountTypeCreateMeta() {
  const { data } = await api.get<ApiSuccess<AccountTypeCreateMeta>>('/account/account-types/create-meta')
  return data.data
}

export async function createAccountType(body: {
  category_id: number
  name: string
  code: string
  normal_balance: 'debit' | 'credit'
  description?: string
  is_active?: boolean
}) {
  const { data } = await api.post<ApiSuccess<AccountTypeRow>>('/account/account-types', body)
  return data.data
}

export async function updateAccountType(
  id: number,
  body: {
    category_id: number
    name: string
    code: string
    normal_balance: 'debit' | 'credit'
    description?: string
    is_active?: boolean
  },
) {
  const { data } = await api.put<ApiSuccess<AccountTypeRow>>(`/account/account-types/${id}`, body)
  return data.data
}

export async function deleteAccountType(id: number) {
  await api.delete(`/account/account-types/${id}`)
}

export function generateAccountTypeCode(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
