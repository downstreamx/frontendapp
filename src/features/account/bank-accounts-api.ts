import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

const base = '/account/bank-accounts'

export type BankAccount = {
  id: number
  account_number: string
  account_name: string
  bank_name: string
  branch_name?: string | null
  account_type: string
  payment_gateway?: string | null
  opening_balance?: number | string
  current_balance?: number | string
  iban?: string | null
  swift_code?: string | null
  routing_number?: string | null
  is_active?: boolean
  gl_account_id?: number
  gl_account?: { id: number; account_code: string; account_name: string }
}

export type BankAccountInput = {
  account_number: string
  account_name: string
  bank_name: string
  branch_name?: string
  account_type: string
  payment_gateway?: string
  opening_balance?: number
  current_balance?: number
  iban?: string
  swift_code?: string
  routing_number?: string
  is_active?: boolean
  gl_account_id: number
}

export type BankAccountCreateMeta = {
  gl_accounts: Array<{ id: number; account_code: string; account_name: string }>
  account_types: Array<{ value: string; label: string }>
}

export async function listBankAccountsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<BankAccount>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<BankAccount>(data)
}

export async function listBankAccounts() {
  const result = await listBankAccountsPaginated({ per_page: '100' })
  return result.rows
}

export async function getBankAccountCreateMeta(): Promise<BankAccountCreateMeta> {
  const { data } = await api.get<ApiSuccess<BankAccountCreateMeta>>(`${base}/create-meta`)
  return data.data
}

export async function getBankAccount(id: number): Promise<BankAccount> {
  const { data } = await api.get<ApiSuccess<BankAccount>>(`${base}/${id}`)
  return data.data
}

export async function createBankAccount(input: BankAccountInput): Promise<BankAccount> {
  const { data } = await api.post<ApiSuccess<BankAccount>>(base, input)
  return data.data
}

export async function updateBankAccount(
  id: number,
  input: Partial<BankAccountInput>,
): Promise<BankAccount> {
  const { data } = await api.put<ApiSuccess<BankAccount>>(`${base}/${id}`, input)
  return data.data
}

export async function deleteBankAccount(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}
