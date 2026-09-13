import { api, type ApiSuccess } from '@/lib/api'
import type { OperationalReportKey } from './operational-reports-config'

export type ReportLinkMeta = {
  key: string
  path: string
  status?: string
  category?: string
}

export type BridgingReportRow = {
  invoice_id: number
  invoice_number: string
  invoice_date: string
  customer_id: number
  customer_name: string
  total_amount: number
  status: string
  load_count: number
  total_loaded_qty: number
}

export type BridgingReportResponse = {
  data: BridgingReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type PurchaseBridgingReportRow = {
  invoice_id: number
  invoice_number: string
  invoice_date: string
  supplier_id: number
  supplier_name: string
  total_amount: number
  status: string
  load_count: number
  total_loaded_qty: number
  total_delivered_qty: number
}

export type PurchaseBridgingReportResponse = {
  data: PurchaseBridgingReportRow[]
  meta: BridgingReportResponse['meta']
}

export type StockBalancesReport = {
  customer_stock_balances: Array<{
    customer_id: number
    customer_name: string
    product_id: number
    product_name: string
    sku?: string
    depot_id?: number
    depot_name?: string
    sales_invoice_id?: number
    invoice_number?: string
    paid_qty: number
    distributed_qty: number
    balance_qty: number
  }>
  supplier_stock_balances?: Array<{
    product_id: number
    product_name: string
    sku?: string
    depot_name?: string
    purchase_invoice_id?: number
    invoice_number?: string
    paid_qty: number
    bridged_qty: number
    balance_qty: number
  }>
  inventory_by_stage?: Array<{
    product_id: number
    product_name?: string
    sku?: string
    bridged_qty: number
    distributed_qty: number
  }>
  depot_stock_balances: Array<{
    depot_id: number
    depot_name: string
    product_id: number
    product_name: string
    sku?: string
    quantity: number
    inventory_value: number
  }>
  summary: {
    customer_balance_qty_total: number
    depot_quantity_total: number
    depot_inventory_value_total: number
  }
}

export type GoodsInTransitRow = {
  type: string
  id: number
  reference: string
  status: string
  quantity: number
  truck?: string
  from?: string
  to?: string
  departed_at?: string
  sales_invoice_number?: string
  product?: string
}

export type GoodsInTransitReport = {
  data: GoodsInTransitRow[]
  summary: { open_count: number; open_quantity: number }
}

export type TrucksOutTodayRow = {
  source: string
  truck?: string
  product?: string
  customer?: string
  depot?: string
  quantity: number
  destination?: string
  status: string
}

export type TrucksOutTodayReport = {
  date: string
  data: TrucksOutTodayRow[]
  summary: { truck_count: number; total_quantity: number }
}

export type BankBalancesEodReport = {
  as_of_date: string
  accounts: Array<{
    id: number
    account_name: string
    account_number?: string
    bank_name: string
    balance: number
    opening_balance: number
    is_active: boolean
  }>
  summary: { total_balance: number; active_accounts: number }
}

async function fetchReport<T>(path: string, params?: Record<string, string>): Promise<T> {
  const { data } = await api.get<ApiSuccess<T>>(path, { params })
  return data.data
}

export async function listOperationalReportCatalog(): Promise<ReportLinkMeta[]> {
  const { data } = await api.get<ApiSuccess<{ reports: ReportLinkMeta[] }>>('/reports')
  return data.data.reports ?? []
}

export async function listDoubleEntryReportCatalog(): Promise<ReportLinkMeta[]> {
  const { data } = await api.get<ApiSuccess<{ reports: ReportLinkMeta[] }>>('/double-entry/reports')
  return data.data.reports ?? []
}

export async function listAccountReportCatalog(): Promise<ReportLinkMeta[]> {
  const { data } = await api.get<ApiSuccess<{ reports: ReportLinkMeta[] }>>('/account/reports')
  return data.data.reports ?? []
}

export async function listAllReportCatalog(): Promise<ReportLinkMeta[]> {
  const [operational, doubleEntry, account] = await Promise.all([
    listOperationalReportCatalog(),
    listDoubleEntryReportCatalog(),
    listAccountReportCatalog(),
  ])
  const seen = new Set<string>()
  const merged: ReportLinkMeta[] = []
  for (const report of [...operational, ...doubleEntry, ...account]) {
    if (seen.has(report.key)) continue
    seen.add(report.key)
    merged.push(report)
  }
  return merged
}

export function fetchOperationalBridgingReport(params?: Record<string, string>) {
  return fetchReport<BridgingReportResponse>('/reports/operational/sales-distribution', params)
}

export function fetchOperationalPurchaseBridgingReport(params?: Record<string, string>) {
  return fetchReport<PurchaseBridgingReportResponse>(
    '/reports/operational/purchase-bridging',
    params,
  )
}

export function fetchOperationalSalesDistributionReport(params?: Record<string, string>) {
  return fetchOperationalBridgingReport(params)
}

export function fetchOperationalStockBalances(params?: Record<string, string>) {
  return fetchReport<StockBalancesReport>('/reports/operational/stock-balances', params)
}

export function fetchOperationalGoodsInTransit(params?: Record<string, string>) {
  return fetchReport<GoodsInTransitReport>('/reports/operational/goods-in-transit', params)
}

export function fetchOperationalTrucksOutToday(params?: Record<string, string>) {
  return fetchReport<TrucksOutTodayReport>('/reports/operational/trucks-out-today', params)
}

export function fetchOperationalBankBalancesEod(params?: Record<string, string>) {
  return fetchReport<BankBalancesEodReport>('/reports/operational/bank-balances-eod', params)
}

export type OperationalReportData =
  | BridgingReportResponse
  | PurchaseBridgingReportResponse
  | StockBalancesReport
  | GoodsInTransitReport
  | TrucksOutTodayReport
  | BankBalancesEodReport

export function fetchOperationalReport(
  reportKey: OperationalReportKey,
  params?: Record<string, string>,
): Promise<OperationalReportData> {
  switch (reportKey) {
    case 'purchase-bridging':
      return fetchOperationalPurchaseBridgingReport(params)
    case 'sales-distribution':
    case 'bridging':
      return fetchOperationalSalesDistributionReport(params)
    case 'stock-balances':
      return fetchOperationalStockBalances(params)
    case 'goods-in-transit':
      return fetchOperationalGoodsInTransit(params)
    case 'trucks-out-today':
      return fetchOperationalTrucksOutToday(params)
    case 'bank-balances-eod':
      return fetchOperationalBankBalancesEod(params)
  }
}
