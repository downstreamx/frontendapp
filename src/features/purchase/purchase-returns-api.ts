import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { PurchaseReturnDetail } from './purchase-return-view-types'

export type PurchaseReturnSupplier = {
  id: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
}

export type PurchaseReturnRow = {
  id: number
  return_number: string
  return_date: string
  supplier_id: number
  depot_id?: number | null
  total_amount: number
  status: string
  reason?: string | null
  supplier?: PurchaseReturnSupplier | null
  depot?: { id: number; name: string } | null
  items?: Array<{
    id: number
    return_quantity: number
    product?: { id: number; name: string; sku?: string | null } | null
  }>
}

export type PurchaseReturnsIndexMeta = {
  suppliers: PurchaseReturnSupplier[]
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
  supplier_id: number
  depot_id?: number | null
  supplier?: { id: number; name: string; email?: string | null } | null
  depot?: { id: number; name: string } | null
  items: EligibleReturnInvoiceItem[]
}

export type PurchaseReturnCreateMeta = PurchaseReturnsIndexMeta & {
  invoices: EligibleReturnInvoice[]
}

export async function fetchPurchaseReturnsIndexMeta(): Promise<PurchaseReturnsIndexMeta> {
  const { data } = await api.get<ApiSuccess<PurchaseReturnsIndexMeta>>('/purchase/returns/index-meta')
  return data.data
}

export async function fetchPurchaseReturnCreateMeta(): Promise<PurchaseReturnCreateMeta> {
  const { data } = await api.get<ApiSuccess<PurchaseReturnCreateMeta>>('/purchase/returns/create-meta')
  return data.data
}

export async function listPurchaseReturnsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<PurchaseReturnRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/purchase/returns', { params })
  return extractPaginatedList<PurchaseReturnRow>(data)
}

export async function fetchPurchaseReturn(id: string | number): Promise<PurchaseReturnDetail> {
  const { data } = await api.get<ApiSuccess<PurchaseReturnDetail>>(`/purchase/returns/${id}`)
  return data.data
}

export async function createPurchaseReturn(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<PurchaseReturnDetail>>('/purchase/returns', body)
  return data.data
}

export async function updatePurchaseReturn(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<PurchaseReturnDetail>>(`/purchase/returns/${id}`, body)
  return data.data
}

export async function deletePurchaseReturn(id: string | number): Promise<void> {
  await api.delete(`/purchase/returns/${id}`)
}

export async function approvePurchaseReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<PurchaseReturnDetail>>(`/purchase/returns/${id}/approve`)
  return data.data
}

export async function completePurchaseReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<PurchaseReturnDetail>>(`/purchase/returns/${id}/complete`)
  return data.data
}
