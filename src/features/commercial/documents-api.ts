import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'
import type { CommercialInvoiceFormValues } from './types'

export type CommercialDocumentRow = {
  id: number
  status?: string
  proposal_number?: string
  return_number?: string
  invoice_number?: string
  total_amount?: number | string
  proposal_date?: string
  return_date?: string
  converted_to_invoice?: boolean
  invoice_id?: number
}

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function unwrapList(payload: unknown): CommercialDocumentRow[] {
  return extractListRows(payload) as CommercialDocumentRow[]
}

const salesOrdersBase = '/sales/sales-orders'

export async function listSalesOrders(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>(salesOrdersBase, { params })
  return unwrapList(data.data)
}

export async function getSalesOrder(id: string | number) {
  const { data } = await api.get<ApiSuccess<unknown>>(`${salesOrdersBase}/${id}`)
  return unwrap(data.data)
}

export async function createSalesOrder(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<unknown>>(salesOrdersBase, body)
  return unwrap(data.data)
}

export async function updateSalesOrder(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<unknown>>(`${salesOrdersBase}/${id}`, body)
  return unwrap(data.data)
}

export async function acceptSalesOrder(id: string | number) {
  const { data } = await api.post<ApiSuccess<unknown>>(`${salesOrdersBase}/${id}/accept`)
  return unwrap(data.data)
}

export async function convertSalesOrderToInvoice(id: string | number) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>(`${salesOrdersBase}/${id}/convert-to-invoice`)
  return unwrap(data.data)
}

export async function listSalesReturns(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/sales/returns', { params })
  return unwrapList(data.data)
}

export async function getSalesReturn(id: string | number) {
  const { data } = await api.get<ApiSuccess<unknown>>(`/sales/returns/${id}`)
  return unwrap(data.data)
}

export async function createSalesReturn(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<unknown>>('/sales/returns', body)
  return unwrap(data.data)
}

export async function updateSalesReturn(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<unknown>>(`/sales/returns/${id}`, body)
  return unwrap(data.data)
}

export async function approveSalesReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/sales/returns/${id}/approve`)
  return unwrap(data.data)
}

export async function completeSalesReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/sales/returns/${id}/complete`)
  return unwrap(data.data)
}

/** @deprecated use approveSalesReturn */
export const postSalesReturn = approveSalesReturn

export async function listPurchaseReturns(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/purchase/returns', { params })
  return unwrapList(data.data)
}

export async function getPurchaseReturn(id: string | number) {
  const { data } = await api.get<ApiSuccess<unknown>>(`/purchase/returns/${id}`)
  return unwrap(data.data)
}

export async function createPurchaseReturn(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<unknown>>('/purchase/returns', body)
  return unwrap(data.data)
}

export async function updatePurchaseReturn(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<unknown>>(`/purchase/returns/${id}`, body)
  return unwrap(data.data)
}

export async function approvePurchaseReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/purchase/returns/${id}/approve`)
  return unwrap(data.data)
}

export async function completePurchaseReturn(id: string | number) {
  const { data } = await api.post<ApiSuccess<unknown>>(`/purchase/returns/${id}/complete`)
  return unwrap(data.data)
}

export const postPurchaseReturn = approvePurchaseReturn

export function mapItemsForSave(items: CommercialInvoiceFormValues['items']) {
  return items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_percentage: item.discount_percentage,
    discount_amount: item.discount_amount,
    tax_percentage: item.tax_percentage,
    tax_amount: item.tax_amount,
    total_amount: item.total_amount,
  }))
}
