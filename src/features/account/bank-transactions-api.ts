import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

const base = '/account/bank-transactions'

export type BankAccountOption = {
  id: number
  account_name: string
  account_number?: string
}

export type BankTransaction = {
  id: number
  bank_account_id?: number
  transaction_date: string
  transaction_type: string
  reference_number?: string | null
  description?: string | null
  amount: number | string
  running_balance: number | string
  transaction_status: string
  reconciliation_status: string
  bank_account?: BankAccountOption
}

export type BankTransactionIndexMeta = {
  bank_accounts: BankAccountOption[]
}

export async function listBankTransactionsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<BankTransaction>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<BankTransaction>(data)
}

export async function listBankTransactions(params?: Record<string, string>) {
  const result = await listBankTransactionsPaginated({ per_page: '100', ...params })
  return result.rows
}

export async function getBankTransactionIndexMeta(): Promise<BankTransactionIndexMeta> {
  const { data } = await api.get<ApiSuccess<BankTransactionIndexMeta>>(`${base}/index-meta`)
  return data.data
}

export async function reconcileBankTransaction(id: number): Promise<BankTransaction> {
  const { data } = await api.patch<ApiSuccess<BankTransaction>>(`${base}/${id}/reconcile`)
  return data.data
}
