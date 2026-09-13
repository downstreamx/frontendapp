import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { PurchaseLineItemSettings } from '@/features/commercial/line-item-settings-types'
import type { SetupPaymentTermOption } from '@/lib/setup-lookup-types'
import type { PurchaseInvoiceDetail } from './purchase-invoice-view-types'

export type PurchaseInvoiceSupplier = {
  id: number
  supplier_profile_id?: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
  payment_terms?: string | null
}

export type PurchaseInvoicesFooter = {
  subtotal: number
  tax_amount: number
  total_amount: number
  balance_amount: number
}

export type PurchaseInvoiceRow = {
  id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  supplier_id: number
  depot_id?: number | null
  total_bridged_qty?: number
  total_balance_qty?: number
  total_paid_qty?: number
  bridging_status?:
    | 'not_eligible'
    | 'unbridged'
    | 'partially_bridged'
    | 'fully_bridged'
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  status: string
  display_status: string
  payment_terms?: string | null
  supplier?: PurchaseInvoiceSupplier | null
}

export type PurchaseInvoicesIndexMeta = {
  suppliers: PurchaseInvoiceSupplier[]
  depots: Array<{ id: number; name: string }>
  payment_terms: SetupPaymentTermOption[]
  line_item_settings?: PurchaseLineItemSettings
}

export async function fetchPurchaseInvoicesIndexMeta(): Promise<PurchaseInvoicesIndexMeta> {
  const { data } = await api.get<ApiSuccess<PurchaseInvoicesIndexMeta>>(
    '/purchase/invoices/index-meta',
  )
  return data.data
}

export type PurchaseInvoiceCreateMeta = PurchaseInvoicesIndexMeta

export async function fetchPurchaseInvoiceCreateMeta(): Promise<PurchaseInvoiceCreateMeta> {
  const { data } = await api.get<ApiSuccess<PurchaseInvoiceCreateMeta>>(
    '/purchase/invoices/create-meta',
  )
  return data.data
}

export async function fetchPurchaseDepotProducts(depotId: string | number) {
  const { data } = await api.get<ApiSuccess<unknown[]>>('/purchase/invoices/depot-products', {
    params: { depot_id: depotId },
  })
  return data.data
}

export type PurchaseInvoicesListResult = PaginatedListResult<PurchaseInvoiceRow> & {
  footer?: PurchaseInvoicesFooter
}

export async function listPurchaseInvoicesPaginated(
  params?: Record<string, string>,
): Promise<PurchaseInvoicesListResult> {
  const { data } = await api.get<ApiSuccess<unknown>>('/purchase/invoices', { params })
  const result = extractPaginatedList<PurchaseInvoiceRow>(data)
  let footer: PurchaseInvoicesFooter | undefined
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const body = data.data as Record<string, unknown>
    if (body.footer && typeof body.footer === 'object') {
      footer = body.footer as PurchaseInvoicesFooter
    }
  }
  return { ...result, footer }
}

export async function fetchPurchaseInvoice(id: string | number): Promise<PurchaseInvoiceDetail> {
  const { data } = await api.get<ApiSuccess<PurchaseInvoiceDetail>>(`/purchase/invoices/${id}`)
  return data.data
}

export async function deletePurchaseInvoice(id: string | number): Promise<void> {
  await api.delete(`/purchase/invoices/${id}`)
}
