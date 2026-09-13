import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { SalesLineItemSettings } from '@/features/commercial/line-item-settings-types'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'
import type { SalesOrderDetail } from './sales-order-view-types'

const salesOrdersBase = '/sales/sales-orders'

export type SalesOrderCustomer = {
  id: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
  payment_terms?: string | null
}

export type SalesOrderRow = {
  id: number
  proposal_number: string
  proposal_date: string
  due_date: string
  customer_id: number
  depot_id?: number | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  converted_to_invoice: boolean
  invoice_id?: number | null
  status: string
  display_status: string
  payment_terms?: string | null
  customer?: SalesOrderCustomer | null
}

export type SalesOrdersIndexMeta = {
  customers: SalesOrderCustomer[]
  depots: Array<{ id: number; name: string }>
  payment_terms: SetupPaymentTermOption[]
  line_item_settings?: SalesLineItemSettings
}

export async function fetchSalesOrdersIndexMeta(): Promise<SalesOrdersIndexMeta> {
  const { data } = await api.get<ApiSuccess<SalesOrdersIndexMeta>>(`${salesOrdersBase}/index-meta`)
  return data.data
}

export type SalesOrderCreateMeta = SalesOrdersIndexMeta

export async function fetchSalesOrderCreateMeta(): Promise<SalesOrderCreateMeta> {
  const { data } = await api.get<ApiSuccess<SalesOrderCreateMeta>>(`${salesOrdersBase}/create-meta`)
  return data.data
}

export async function fetchSalesOrderDepotProducts(
  depotId: string | number,
  options?: { includeProductIds?: number[] },
) {
  const include = options?.includeProductIds?.filter((id) => id > 0) ?? []
  const { data } = await api.get<ApiSuccess<unknown[]>>(`${salesOrdersBase}/depot-products`, {
    params: {
      depot_id: depotId,
      ...(include.length > 0 ? { include_product_ids: include.join(',') } : {}),
    },
  })
  return data.data
}

export async function listSalesOrdersPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<SalesOrderRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>(salesOrdersBase, { params })
  return extractPaginatedList<SalesOrderRow>(data)
}

export async function fetchSalesOrder(id: string | number): Promise<SalesOrderDetail> {
  const { data } = await api.get<ApiSuccess<SalesOrderDetail>>(`${salesOrdersBase}/${id}`)
  return data.data
}

export async function deleteSalesOrder(id: string | number): Promise<void> {
  await api.delete(`${salesOrdersBase}/${id}`)
}

export async function sendSalesOrder(id: string | number) {
  const { data } = await api.post<ApiSuccess<SalesOrderDetail>>(`${salesOrdersBase}/${id}/send`)
  return data.data
}

export async function acceptSalesOrder(id: string | number) {
  const { data } = await api.post<ApiSuccess<SalesOrderDetail>>(`${salesOrdersBase}/${id}/accept`)
  return data.data
}

export async function rejectSalesOrder(id: string | number) {
  const { data } = await api.post<ApiSuccess<SalesOrderDetail>>(`${salesOrdersBase}/${id}/reject`)
  return data.data
}

export async function convertSalesOrderToInvoice(id: string | number) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>(`${salesOrdersBase}/${id}/convert-to-invoice`)
  return data.data
}

export async function createSalesOrder(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<SalesOrderDetail>>(salesOrdersBase, body)
  return data.data
}

export async function updateSalesOrder(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<SalesOrderDetail>>(`${salesOrdersBase}/${id}`, body)
  return data.data
}
