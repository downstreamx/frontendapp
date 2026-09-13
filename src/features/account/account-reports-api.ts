import { api, type ApiSuccess } from '@/lib/api'

export type AgingSummary = {
  current: number
  '1_30_days': number
  '31_60_days': number
  '61_90_days': number
  over_90_days: number
  total: number
}

export type AgingPartyRow = {
  customer_name?: string
  supplier_name?: string
  current: number
  '1_30_days': number
  '31_60_days': number
  '61_90_days': number
  over_90_days: number
  total: number
}

export type InvoiceAgingReport = {
  aging_summary: AgingSummary
  customers: AgingPartyRow[]
  as_of_date: string
}

export type BillAgingReport = {
  aging_summary: AgingSummary
  suppliers: AgingPartyRow[]
  as_of_date: string
}

export type TaxSummaryReport = {
  tax_collected: { items: Array<{ tax_name: string; amount: number }>; total: number }
  tax_paid: { items: Array<{ tax_name: string; amount: number }>; total: number }
  net_tax_liability: number
  from_date: string
  to_date: string
}

export type SupplierBalanceRow = {
  supplier_id: number
  supplier_name: string
  supplier_email?: string | null
  total_billed: number
  total_returns: number
  net_billed: number
  total_paid: number
  balance: number
}

export type SupplierBalanceReport = {
  suppliers: SupplierBalanceRow[]
  total_balance: number
  as_of_date: string
}

export type AccountReportKey =
  | 'invoice-aging'
  | 'bill-aging'
  | 'tax-summary'
  | 'supplier-balance'

export async function fetchInvoiceAging(params: { as_of_date: string }): Promise<InvoiceAgingReport> {
  const { data } = await api.get<ApiSuccess<InvoiceAgingReport>>(
    '/account/reports/invoice-aging',
    { params },
  )
  return data.data
}

export async function fetchBillAging(params: { as_of_date: string }): Promise<BillAgingReport> {
  const { data } = await api.get<ApiSuccess<BillAgingReport>>('/account/reports/bill-aging', {
    params,
  })
  return data.data
}

export async function fetchTaxSummary(params: {
  from_date: string
  to_date: string
}): Promise<TaxSummaryReport> {
  const { data } = await api.get<ApiSuccess<TaxSummaryReport>>('/account/reports/tax-summary', {
    params,
  })
  return data.data
}

export async function fetchSupplierBalanceReport(params: {
  as_of_date: string
  show_zero_balances?: boolean
}): Promise<SupplierBalanceReport> {
  const { data } = await api.get<ApiSuccess<SupplierBalanceReport>>(
    '/account/reports/supplier-balance',
    { params },
  )
  return data.data
}
