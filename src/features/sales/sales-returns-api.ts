import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { SalesReturnDetail } from './sales-return-view-types'

export type SalesReturnCustomer = {
  id: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
}

export type SalesReturnRow = {
  id: number
  return_number: string
  return_date: string
  customer_id: number
  depot_id?: number | null
  total_amount: number
  status: string
  reason?: string | null
  customer?: SalesReturnCustomer | null
  depot?: { id: number; name: string } | null
  items?: Array<{
    id: number
    return_quantity: number
    product?: { id: number; name: string; sku?: string | null } | null
  }>
}

export type SalesReturnsIndexMeta = {
  customers: SalesReturnCustomer[]
  depots: Array<{ id: number; name: string }>
}

export type EligibleReturnInvoiceItem = {
  id: number
  product_id: number
  quantity: number
  available_quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  tax_percentage: number
  tax_amount: number
  product?: { id: number; name: string; sku?: string | null } | null
}

export type EligibleReturnInvoice = {
  id: number
  invoice_number: string
  customer_id: number
  depot_id?: number | null
  customer?: { id: number; name: string; email?: string | null } | null
  depot?: { id: number; name: string } | null
  items: EligibleReturnInvoiceItem[]
}

export type SalesReturnCreateMeta = SalesReturnsIndexMeta & {
  invoices: EligibleReturnInvoice[]
}

export async function fetchSalesReturnsIndexMeta(): Promise<SalesReturnsIndexMeta> {
  const { data } = await api.get<ApiSuccess<SalesReturnsIndexMeta>>('/sales/returns/index-meta')
  return data.data
}

export async function fetchSalesReturnCreateMeta(): Promise<SalesReturnCreateMeta> {
  const { data } = await api.get<ApiSuccess<SalesReturnCreateMeta>>('/sales/returns/create-meta')
  return data.data
}

export async function listSalesReturnsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<SalesReturnRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/sales/returns', { params })
  return extractPaginatedList<SalesReturnRow>(data)
}

export async function fetchSalesReturn(id: string | number): Promise<SalesReturnDetail> {
  const { data } = await api.get<ApiSuccess<SalesReturnDetail>>(`/sales/returns/${id}`)
  return data.data
}

export async function createSalesReturn(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<SalesReturnDetail>>('/sales/returns', body)
  return data.data
}

export async function updateSalesReturn(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<SalesReturnDetail>>(`/sales/returns/${id}`, body)
  return data.data
}

export async function deleteSalesReturn(id: string | number): Promise<void> {
  await api.delete(`/sales/returns/${id}`)
}

export async function approveSalesReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<SalesReturnDetail>>(`/sales/returns/${id}/approve`)
  return data.data
}

export async function completeSalesReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<SalesReturnDetail>>(`/sales/returns/${id}/complete`)
  return data.data
}
