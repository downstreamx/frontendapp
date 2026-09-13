import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

const creditBase = '/account/credit-notes'

export type CreditNoteRow = {
  id: number
  credit_note_number?: string
  credit_note_date?: string
  status: string
  reason?: string
  total_amount?: number | string
  applied_amount?: number | string
  balance_amount?: number | string
  customer?: { id: number; name: string; email?: string }
  sales_return?: { id: number; return_number?: string } | null
  approved_by?: { id: number; name: string } | null
}

export type CreditNoteItem = {
  id: number
  quantity: number | string
  unit_price: number | string
  discount_percentage?: number | string
  discount_amount?: number | string
  tax_percentage?: number | string
  tax_amount?: number | string
  total_amount?: number | string
  product?: {
    id: number
    name: string
    sku?: string
    description?: string
  }
  taxes?: Array<{ tax_name: string; tax_rate: number | string }>
}

export type CreditNoteApplication = {
  id: number
  applied_amount: number | string
  application_date?: string
  payment?: { id: number; payment_number?: string }
}

export type CreditNoteDetail = CreditNoteRow & {
  notes?: string
  subtotal?: number | string
  tax_amount?: number | string
  discount_amount?: number | string
  items?: CreditNoteItem[]
  applications?: CreditNoteApplication[]
}

export type CreditNotesIndexMeta = {
  customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  sales_returns: Array<{ id: number; return_number: string }>
}

export async function fetchCreditNotesIndexMeta(): Promise<CreditNotesIndexMeta> {
  const { data } = await api.get<ApiSuccess<CreditNotesIndexMeta>>(`${creditBase}/index-meta`)
  return data.data
}

export async function listCreditNotesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<CreditNoteRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>(creditBase, { params })
  return extractPaginatedList<CreditNoteRow>(data)
}

export async function getCreditNote(id: string | number): Promise<CreditNoteDetail> {
  const { data } = await api.get<ApiSuccess<CreditNoteDetail>>(`${creditBase}/${id}`)
  return data.data
}

export async function approveCreditNote(id: string | number): Promise<CreditNoteDetail> {
  const { data } = await api.post<ApiSuccess<CreditNoteDetail>>(`${creditBase}/${id}/approve`)
  return data.data
}

export async function deleteCreditNote(id: string | number): Promise<void> {
  await api.delete(`${creditBase}/${id}`)
}

const debitBase = '/account/debit-notes'

export type DebitNoteRow = {
  id: number
  debit_note_number?: string
  debit_note_date?: string
  status: string
  reason?: string
  total_amount?: number | string
  applied_amount?: number | string
  balance_amount?: number | string
  supplier?: { id: number; name: string; email?: string }
  purchase_return?: { id: number; return_number?: string } | null
  approved_by?: { id: number; name: string } | null
}

export type DebitNoteItem = {
  id: number
  quantity: number | string
  unit_price: number | string
  discount_percentage?: number | string
  discount_amount?: number | string
  tax_percentage?: number | string
  tax_amount?: number | string
  total_amount?: number | string
  product?: {
    id: number
    name: string
    sku?: string
    description?: string
  }
  taxes?: Array<{ tax_name: string; tax_rate: number | string }>
}

export type DebitNoteApplication = {
  id: number
  applied_amount: number | string
  application_date?: string
  payment?: { id: number; payment_number?: string }
}

export type DebitNoteDetail = DebitNoteRow & {
  notes?: string
  subtotal?: number | string
  tax_amount?: number | string
  discount_amount?: number | string
  items?: DebitNoteItem[]
  applications?: DebitNoteApplication[]
}

export type DebitNotesIndexMeta = {
  suppliers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  purchase_returns: Array<{ id: number; return_number: string }>
}

export async function fetchDebitNotesIndexMeta(): Promise<DebitNotesIndexMeta> {
  const { data } = await api.get<ApiSuccess<DebitNotesIndexMeta>>(`${debitBase}/index-meta`)
  return data.data
}

export async function listDebitNotesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<DebitNoteRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>(debitBase, { params })
  return extractPaginatedList<DebitNoteRow>(data)
}

export async function getDebitNote(id: string | number): Promise<DebitNoteDetail> {
  const { data } = await api.get<ApiSuccess<DebitNoteDetail>>(`${debitBase}/${id}`)
  return data.data
}

export async function approveDebitNote(id: string | number): Promise<DebitNoteDetail> {
  const { data } = await api.post<ApiSuccess<DebitNoteDetail>>(`${debitBase}/${id}/approve`)
  return data.data
}

export async function deleteDebitNote(id: string | number): Promise<void> {
  await api.delete(`${debitBase}/${id}`)
}
