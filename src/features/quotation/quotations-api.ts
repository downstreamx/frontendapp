import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'

export type Quotation = {
  id: number
  quotation_number?: string
  quotation_date: string
  due_date: string
  status: string
  total_amount?: number | string
  subtotal?: number | string
  tax_amount?: number | string
  customer_id: number
  revision_number?: number
  customer?: { id: number; name: string; email?: string } | null
  depot?: { id: number; name: string } | null
  items_count?: number
  notes?: string
  payment_terms?: string
  items?: Array<{
    id: number
    product_id: number
    quantity: number
    unit_price: string
    total_amount: string
    product?: { id: number; name: string; sku?: string }
  }>
}

export type QuotationsIndexMeta = {
  statuses: string[]
  customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
    payment_terms?: string | null
  }>
  depots: Array<{ id: number; name: string }>
  products: Array<{ id: number; name: string; sku?: string; sale_price?: number | string }>
  payment_terms: SetupPaymentTermOption[]
}

export async function fetchQuotationsIndexMeta() {
  const { data } = await api.get<ApiSuccess<QuotationsIndexMeta>>('/quotation/quotations/index-meta')
  return data.data
}

export async function listQuotationsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<Quotation>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/quotation/quotations', { params })
  return extractPaginatedList<Quotation>(data)
}

export type QuotationLineInput = {
  product_id: number
  quantity: number
  unit_price: number
}

export async function createQuotation(input: {
  customer_id: number
  quotation_date: string
  due_date: string
  depot_id: number
  notes?: string
  payment_terms?: string
  items: QuotationLineInput[]
}) {
  const { data } = await api.post<ApiSuccess<Quotation>>('/quotation/quotations', input)
  return data.data
}

export async function updateQuotation(
  id: number,
  input: {
    customer_id: number
    quotation_date: string
    due_date: string
    depot_id: number
    notes?: string
    payment_terms?: string
    items: QuotationLineInput[]
  },
) {
  const { data } = await api.put<ApiSuccess<Quotation>>(`/quotation/quotations/${id}`, input)
  return data.data
}

export async function getQuotation(id: number) {
  const { data } = await api.get<ApiSuccess<Quotation>>(`/quotation/quotations/${id}`)
  return data.data
}

export async function advanceQuotationStatus(id: number, transition: 'advance' | 'reject' = 'advance') {
  const { data } = await api.post<ApiSuccess<Quotation>>(`/quotation/quotations/${id}/advance-status`, {
    transition,
  })
  return data.data
}

export const quotationAdvanceLabels: Record<string, string> = {
  draft: 'Mark sent',
  sent: 'Mark accepted',
}
