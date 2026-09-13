import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type BankTransferPaymentRow = {
  id: number
  order_id?: string
  status?: string
  type?: string
  price?: number
  price_currency?: string
  attachment?: string | null
  request?: Record<string, unknown>
  user?: { id: number; name: string; email?: string }
  plan?: { id: number; name: string }
  created_at?: string
}

export async function listBankTransferPaymentsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<BankTransferPaymentRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/bank-transfer', { params })
  return extractPaginatedList<BankTransferPaymentRow>(data)
}

export async function getBankTransferPayment(id: number) {
  const { data } = await api.get<ApiSuccess<BankTransferPaymentRow>>(`/bank-transfer/${id}`)
  return data.data
}

export async function approveBankTransferPayment(id: number) {
  const { data } = await api.post<ApiSuccess<BankTransferPaymentRow>>(`/bank-transfer/${id}/approve`)
  return data.data
}

export async function rejectBankTransferPayment(id: number) {
  const { data } = await api.post<ApiSuccess<BankTransferPaymentRow>>(`/bank-transfer/${id}/reject`)
  return data.data
}

export async function deleteBankTransferPayment(id: number) {
  await api.delete(`/bank-transfer/${id}`)
}

/** @deprecated Use listBankTransferPaymentsPaginated */
export async function listBankTransferPayments() {
  const result = await listBankTransferPaymentsPaginated({ per_page: '100' })
  return result.rows
}
