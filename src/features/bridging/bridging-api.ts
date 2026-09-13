import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import type { CommercialKind } from '@/features/commercial/api'
import {
  normalizeEntitlementSummary,
  normalizeProvisionLoading,
  normalizePurchaseBridgingProgress,
  normalizeSalesDistributionProgress,
  normalizeTruckLoad,
  normalizeTruckLoads,
  normalizeUnbridgedPurchaseRow,
  normalizeUndistributedSalesRow,
} from './normalizers'
import type {
  AssignTruckLoadPayload,
  BridgedAvailableTruckLoad,
  BulkAssignTruckLoadsPayload,
  BulkStorePurchaseTruckLoadPayload,
  ConfirmTruckLoadDeliveryPayload,
  EntitlementSummary,
  ProvisionLoadingResult,
  PurchaseBridgingProgress,
  SalesDistributionProgress,
  StorePurchaseTruckLoadPayload,
  TruckLoad,
  UndistributedSalesRow,
  UnbridgedPurchaseRow,
} from './types'

export type {
  AssignTruckLoadPayload,
  BridgedAvailableTruckLoad,
  CustomerStockBalance,
  BulkAssignTruckLoadsPayload,
  BulkStorePurchaseTruckLoadPayload,
  ConfirmTruckLoadDeliveryPayload,
  EntitlementSummary,
  ProvisionLoadingResult,
  PurchaseBridgingProgress,
  SalesDistributionProgress,
  StorePurchaseTruckLoadPayload,
  StoreTruckLoadPayload,
  TruckLoad,
  TruckLoadPhase,
  UndistributedSalesRow,
  UnbridgedPurchaseRow,
} from './types'

function invoiceBase(kind: CommercialKind) {
  return kind === 'sales' ? '/sales/invoices' : '/purchase/invoices'
}

function mapPaginated<T>(
  result: PaginatedListResult<unknown>,
  mapRow: (row: unknown) => T,
): PaginatedListResult<T> {
  return {
    rows: result.rows.map(mapRow),
    meta: result.meta,
  }
}

export async function listUndistributedSales(
  params?: Record<string, string>,
): Promise<PaginatedListResult<UndistributedSalesRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/sales/undistributed', { params })
  return mapPaginated(extractPaginatedList(data), normalizeUndistributedSalesRow)
}

export async function listUnbridgedPurchases(
  params?: Record<string, string>,
): Promise<PaginatedListResult<UnbridgedPurchaseRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/purchase/unbridged', { params })
  return mapPaginated(extractPaginatedList(data), normalizeUnbridgedPurchaseRow)
}

export async function listTruckLoads(
  params?: Record<string, string>,
): Promise<PaginatedListResult<TruckLoad>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/truck-loads', { params })
  return mapPaginated(extractPaginatedList(data), normalizeTruckLoad)
}

export async function listProcurementBridgings(
  params?: Record<string, string>,
): Promise<PaginatedListResult<TruckLoad>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/procurement/bridgings', { params })
  return mapPaginated(extractPaginatedList(data), normalizeTruckLoad)
}

export async function listTransitMonitoring(
  params?: Record<string, string>,
): Promise<PaginatedListResult<TruckLoad>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/distribution/transit-monitoring', {
    params,
  })
  return mapPaginated(extractPaginatedList(data), normalizeTruckLoad)
}

export async function listTrucksInTransit(
  cargo: 'empty' | 'goods',
  params?: Record<string, string>,
): Promise<PaginatedListResult<TruckLoad>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/distribution/trucks-in-transit', {
    params: { cargo, ...params },
  })
  return mapPaginated(extractPaginatedList(data), normalizeTruckLoad)
}

export async function getTruckLoad(truckLoadId: string | number): Promise<TruckLoad> {
  const { data } = await api.get<ApiSuccess<unknown>>(`/truck-loads/${truckLoadId}`)
  return normalizeTruckLoad(data.data)
}

export async function listBridgedAvailableTruckLoads(
  params?: Record<string, string>,
): Promise<PaginatedListResult<BridgedAvailableTruckLoad>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/trucks/bridged-available', { params })
  return mapPaginated(extractPaginatedList(data), normalizeTruckLoad)
}

export async function createPurchaseTruckLoad(
  purchaseInvoiceId: string | number,
  body: StorePurchaseTruckLoadPayload,
): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/purchase/invoices/${purchaseInvoiceId}/truck-loads`,
    body,
  )
  return normalizeTruckLoad(data.data)
}

export async function bulkCreatePurchaseTruckLoads(
  purchaseInvoiceId: string | number,
  body: BulkStorePurchaseTruckLoadPayload,
): Promise<TruckLoad[]> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/purchase/invoices/${purchaseInvoiceId}/truck-loads/bulk`,
    body,
  )
  return normalizeTruckLoads(data.data)
}

export async function bulkAssignTruckLoadsToSalesInvoice(
  salesInvoiceId: string | number,
  body: BulkAssignTruckLoadsPayload,
): Promise<TruckLoad[]> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/sales/invoices/${salesInvoiceId}/assign-truck-loads/bulk`,
    body,
  )
  return normalizeTruckLoads(data.data)
}

export async function approveTruckLoad(truckLoadId: string | number): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(`/truck-loads/${truckLoadId}/approve`)
  return normalizeTruckLoad(data.data)
}

export async function confirmTruckLoadArrival(truckLoadId: string | number): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/truck-loads/${truckLoadId}/confirm-arrival`,
  )
  return normalizeTruckLoad(data.data)
}

export async function assignTruckLoadToSalesInvoice(
  truckLoadId: string | number,
  body: Omit<AssignTruckLoadPayload, 'truck_load_id'>,
): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/truck-loads/${truckLoadId}/assign-sales-invoice`,
    body,
  )
  return normalizeTruckLoad(data.data)
}

export async function assignTruckLoadViaSalesInvoice(
  salesInvoiceId: string | number,
  body: AssignTruckLoadPayload,
): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/sales/invoices/${salesInvoiceId}/assign-truck-load`,
    body,
  )
  return normalizeTruckLoad(data.data)
}

export async function cancelTruckLoadDistribution(
  truckLoadId: string | number,
  body: { sales_invoice_id: number; customer_stock_balance_id?: number },
): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/truck-loads/${truckLoadId}/cancel-distribution`,
    body,
  )
  return normalizeTruckLoad(data.data)
}

export async function confirmTruckLoadDelivery(
  truckLoadId: string | number,
  body: ConfirmTruckLoadDeliveryPayload = {},
): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/truck-loads/${truckLoadId}/confirm-delivery`,
    body,
  )
  return normalizeTruckLoad(data.data)
}

export async function releaseTruck(truckLoadId: string | number): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(`/truck-loads/${truckLoadId}/release`)
  const payload = data.data
  if (payload != null && typeof payload === 'object') {
    return normalizeTruckLoad(payload)
  }
  return normalizeTruckLoad({ id: truckLoadId, truck_load_id: truckLoadId })
}

export async function cancelTruckLoad(truckLoadId: string | number): Promise<TruckLoad> {
  const { data } = await api.post<ApiSuccess<unknown>>(`/truck-loads/${truckLoadId}/cancel`)
  return normalizeTruckLoad(data.data)
}

export async function fetchInvoiceStockBalances(
  kind: CommercialKind,
  invoiceId: string | number,
): Promise<EntitlementSummary> {
  const path =
    kind === 'sales'
      ? `${invoiceBase(kind)}/${invoiceId}/stock-balances`
      : `${invoiceBase(kind)}/${invoiceId}/entitlement`
  const { data } = await api.get<ApiSuccess<unknown>>(path)
  return normalizeEntitlementSummary(kind, data.data)
}

/** @deprecated Use fetchInvoiceStockBalances */
export const fetchInvoiceEntitlement = fetchInvoiceStockBalances

export async function provisionInvoiceLoading(
  kind: CommercialKind,
  invoiceId: string | number,
): Promise<ProvisionLoadingResult> {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `${invoiceBase(kind)}/${invoiceId}/provision-loading`,
  )
  return normalizeProvisionLoading(kind, data.data)
}

export async function fetchPurchaseBridgingProgress(
  purchaseInvoiceId: string | number,
): Promise<PurchaseBridgingProgress> {
  const { data } = await api.get<ApiSuccess<unknown>>(
    `/purchase/invoices/${purchaseInvoiceId}/bridging-progress`,
  )
  return normalizePurchaseBridgingProgress(data.data)
}

export async function fetchSalesDistributionProgress(
  salesInvoiceId: string | number,
): Promise<SalesDistributionProgress> {
  const { data } = await api.get<ApiSuccess<unknown>>(
    `/sales/invoices/${salesInvoiceId}/distribution-progress`,
  )
  return normalizeSalesDistributionProgress(data.data)
}

export async function applySalesCreditEntitlements(salesInvoiceId: string | number): Promise<void> {
  await api.post(`/sales/invoices/${salesInvoiceId}/apply-credit-entitlements`)
}

export async function fetchInvoiceTruckLoads(
  kind: CommercialKind,
  invoiceId: string | number,
): Promise<TruckLoad[]> {
  const { data } = await api.get<ApiSuccess<unknown>>(
    `${invoiceBase(kind)}/${invoiceId}/truck-loads`,
  )
  return normalizeTruckLoads(data.data)
}
