import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

const base = '/account/bank-transfers'

export type BankAccountOption = {
  id: number
  account_name: string
  account_number?: string
  current_balance?: number | string
}

export type BankTransfer = {
  id: number
  transfer_number?: string
  transfer_date: string
  transfer_amount: number | string
  transfer_charges?: number | string
  reference_number?: string | null
  description?: string
  status: string
  from_account_id?: number
  to_account_id?: number
  from_account?: BankAccountOption
  to_account?: BankAccountOption
  created_at?: string
}

export type BankTransferInput = {
  transfer_date: string
  from_account_id: number
  to_account_id: number
  transfer_amount: number
  transfer_charges?: number
  reference_number?: string
  description: string
}

export type BankTransferCreateMeta = {
  bank_accounts: BankAccountOption[]
}

export async function listBankTransfersPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<BankTransfer>> {
  const { data } = await api.get<ApiSuccess<unknown>>(base, { params })
  return extractPaginatedList<BankTransfer>(data)
}

export async function listBankTransfers() {
  const result = await listBankTransfersPaginated({ per_page: '100' })
  return result.rows
}

export async function getBankTransferCreateMeta(): Promise<BankTransferCreateMeta> {
  const { data } = await api.get<ApiSuccess<BankTransferCreateMeta>>(`${base}/create-meta`)
  return data.data
}

export async function getBankTransfer(id: number): Promise<BankTransfer> {
  const { data } = await api.get<ApiSuccess<BankTransfer>>(`${base}/${id}`)
  return data.data
}

export async function createBankTransfer(input: BankTransferInput): Promise<BankTransfer> {
  const { data } = await api.post<ApiSuccess<BankTransfer>>(base, input)
  return data.data
}

export async function updateBankTransfer(
  id: number,
  input: Partial<BankTransferInput>,
): Promise<BankTransfer> {
  const { data } = await api.put<ApiSuccess<BankTransfer>>(`${base}/${id}`, input)
  return data.data
}

export async function deleteBankTransfer(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}

export async function processBankTransfer(id: number): Promise<BankTransfer> {
  const { data } = await api.post<ApiSuccess<BankTransfer>>(`${base}/${id}/process`)
  return data.data
}
