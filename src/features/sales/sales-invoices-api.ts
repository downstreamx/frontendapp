import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { SalesLineItemSettings } from '@/features/commercial/line-item-settings-types'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'
import type { SalesInvoiceDetail } from './sales-invoice-view-types'

export type SalesInvoiceCustomer = {
  id: number
  customer_profile_id?: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
  payment_terms?: string | null
}

export type SalesInvoiceRow = {
  id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  customer_id: number
  depot_id?: number | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  total_distributed_qty?: number
  total_balance_qty?: number
  total_paid_qty?: number
  distribution_status?:
    | 'not_eligible'
    | 'undistributed'
    | 'partially_distributed'
    | 'fully_distributed'
  status: string
  display_status: string
  payment_terms?: string | null
  customer?: SalesInvoiceCustomer | null
}

export type SalesInvoicesIndexMeta = {
  customers: SalesInvoiceCustomer[]
  depots: Array<{ id: number; name: string }>
  payment_terms: SetupPaymentTermOption[]
  line_item_settings?: SalesLineItemSettings
}

export async function fetchSalesInvoicesIndexMeta(): Promise<SalesInvoicesIndexMeta> {
  const { data } = await api.get<ApiSuccess<SalesInvoicesIndexMeta>>('/sales/invoices/index-meta')
  return data.data
}

export type SalesInvoiceCreateMeta = SalesInvoicesIndexMeta

export async function fetchSalesInvoiceCreateMeta(): Promise<SalesInvoiceCreateMeta> {
  const { data } = await api.get<ApiSuccess<SalesInvoiceCreateMeta>>('/sales/invoices/create-meta')
  return data.data
}

export async function fetchSalesDepotProducts(
  depotId: string | number,
  options?: { includeProductIds?: number[] },
) {
  const include = options?.includeProductIds?.filter((id) => id > 0) ?? []
  const { data } = await api.get<ApiSuccess<unknown[]>>('/sales/invoices/depot-products', {
    params: {
      depot_id: depotId,
      ...(include.length > 0 ? { include_product_ids: include.join(',') } : {}),
    },
  })
  return data.data
}

export async function fetchSalesServices() {
  const { data } = await api.get<ApiSuccess<unknown[]>>('/sales/invoices/services')
  return data.data
}

export async function listSalesInvoicesPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<SalesInvoiceRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/sales/invoices', { params })
  return extractPaginatedList<SalesInvoiceRow>(data)
}

export async function fetchSalesInvoice(id: string | number): Promise<SalesInvoiceDetail> {
  const { data } = await api.get<ApiSuccess<SalesInvoiceDetail>>(`/sales/invoices/${id}`)
  return data.data
}

export async function deleteSalesInvoice(id: string | number): Promise<void> {
  await api.delete(`/sales/invoices/${id}`)
}
