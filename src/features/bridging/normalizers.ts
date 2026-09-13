import type { CommercialKind } from '@/features/commercial/api'
import type {
  CustomerStockBalance,
  EntitlementSummary,
  LoadsByPhase,
  PurchaseBridgingProgress,
  SalesDistributionProgress,
  TruckLoad,
  TruckLoadPhase,
  UndistributedSalesRow,
  UnbridgedPurchaseRow,
} from './types'

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

/** Laravel JsonResource collections may serialize as `{ data: [...] }` when nested in a custom payload. */
function unwrapResourceList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  const wrapped = asRecord(raw).data
  return Array.isArray(wrapped) ? wrapped : []
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function normalizeTruckLoad(raw: unknown): TruckLoad {
  const row = asRecord(raw)
  const id = num(row.id)
  const loadNumber = str(row.load_number, `TL-${id}`)
  const phase = str(row.phase, 'awaiting_load') as TruckLoadPhase

  return {
    id,
    truck_load_id: num(row.truck_load_id, id),
    load_number: loadNumber,
    phase,
    next_phase: (optionalStr(row.next_phase) as TruckLoadPhase | undefined) ?? null,
    purchase_invoice_id: row.purchase_invoice_id != null ? num(row.purchase_invoice_id) : null,
    sales_invoice_id: row.sales_invoice_id != null ? num(row.sales_invoice_id) : null,
    supplier_product_entitlement_id:
      row.supplier_product_entitlement_id != null
        ? num(row.supplier_product_entitlement_id)
        : null,
    customer_stock_balance_id:
      row.customer_stock_balance_id != null
        ? num(row.customer_stock_balance_id)
        : null,
    product_id: row.product_id != null ? num(row.product_id) : null,
    truck_id: row.truck_id != null ? num(row.truck_id) : undefined,
    driver_id: row.driver_id != null ? num(row.driver_id) : null,
    loading_depot_id: row.loading_depot_id != null ? num(row.loading_depot_id) : null,
    loading_date: optionalStr(row.loading_date),
    quantity: num(row.quantity),
    quantity_unit: optionalStr(row.quantity_unit),
    assigned_qty: num(row.assigned_qty),
    delivered_qty: num(row.delivered_qty),
    remaining_assignable_qty: num(row.remaining_assignable_qty),
    destination: optionalStr(row.destination),
    waybill_number: optionalStr(row.waybill_number),
    meter_number: optionalStr(row.meter_number),
    notes: optionalStr(row.notes),
    approved_at: optionalStr(row.approved_at) ?? null,
    released_at: optionalStr(row.released_at) ?? null,
    truck: row.truck ? normalizeTruckRef(row.truck) : undefined,
    driver: row.driver ? normalizeDriverRef(row.driver) : undefined,
    loading_depot: row.loading_depot ? normalizeDepotRef(row.loading_depot) : undefined,
    purchase_invoice: row.purchase_invoice ? normalizeInvoiceRef(row.purchase_invoice) : null,
    sales_invoice: row.sales_invoice ? normalizeInvoiceRef(row.sales_invoice) : null,
    sales_allocations: Array.isArray(row.sales_allocations)
      ? row.sales_allocations.map(normalizeSalesAllocation)
      : undefined,
    is_fully_assigned: row.is_fully_assigned === true,
    product: row.product ? normalizeProductRef(row.product) : undefined,
    customer: row.customer ? normalizeCustomerRef(row.customer) : undefined,
    unit_rate: row.unit_rate != null ? num(row.unit_rate) : undefined,
  }
}

function normalizeProductRef(raw: unknown): import('./types').TruckLoadProductRef {
  const row = asRecord(raw)
  return {
    id: num(row.id),
    name: str(row.name),
    sku: optionalStr(row.sku),
  }
}

function normalizeCustomerRef(raw: unknown): import('./types').TruckLoadCustomerRef {
  const row = asRecord(raw)
  return {
    id: num(row.id),
    name: str(row.name),
  }
}

function normalizeSalesAllocation(raw: unknown): import('./types').TruckLoadSalesAllocation {
  const row = asRecord(raw)
  return {
    id: num(row.id),
    truck_load_id: num(row.truck_load_id),
    sales_invoice_id: num(row.sales_invoice_id),
    customer_stock_balance_id: num(row.customer_stock_balance_id),
    quantity: num(row.quantity),
    sales_invoice: row.sales_invoice ? normalizeInvoiceRef(row.sales_invoice) : undefined,
  }
}

export function normalizeTruckLoads(raw: unknown): TruckLoad[] {
  return unwrapResourceList(raw).map(normalizeTruckLoad)
}

function normalizeTruckRef(raw: unknown): TruckLoad['truck'] {
  const row = asRecord(raw)
  return {
    id: num(row.id),
    plate_number: optionalStr(row.plate_number),
    avatar: (row.avatar as string | null | undefined) ?? null,
    operational_status: optionalStr(row.operational_status) ?? null,
    fuel_capacity: row.fuel_capacity != null ? num(row.fuel_capacity) : undefined,
    capacity_litres: row.capacity_litres != null ? num(row.capacity_litres) : undefined,
    make: optionalStr(row.make),
  }
}

function normalizeDriverRef(raw: unknown): TruckLoad['driver'] {
  const row = asRecord(raw)
  return {
    id: num(row.id),
    first_name: optionalStr(row.first_name),
    last_name: optionalStr(row.last_name),
    user: row.user ? { id: num(asRecord(row.user).id), avatar: asRecord(row.user).avatar as string | null } : undefined,
  }
}

function normalizeDepotRef(raw: unknown): { id: number; name: string } {
  const row = asRecord(raw)
  return { id: num(row.id), name: str(row.name) }
}

function normalizeInvoiceRef(raw: unknown): { id: number; invoice_number?: string } {
  const row = asRecord(raw)
  return { id: num(row.id), invoice_number: optionalStr(row.invoice_number) }
}

export function normalizeStockBalance(raw: unknown): CustomerStockBalance {
  const row = asRecord(raw)
  const distributedQty =
    row.distributed_qty != null ? num(row.distributed_qty) : num(row.bridged_qty, 0)
  const bridgedQty = row.bridged_qty != null ? num(row.bridged_qty) : distributedQty

  return {
    id: num(row.id),
    product_id: num(row.product_id),
    depot_id: row.depot_id != null ? num(row.depot_id) : null,
    paid_qty: num(row.paid_qty),
    bridged_qty: bridgedQty,
    distributed_qty: distributedQty,
    balance_qty: num(row.balance_qty),
    status: str(row.status),
    bridged_truck_count:
      row.bridged_truck_count != null ? num(row.bridged_truck_count) : undefined,
    product: row.product
      ? {
          id: num(asRecord(row.product).id),
          name: str(asRecord(row.product).name),
          sku: optionalStr(asRecord(row.product).sku),
        }
      : undefined,
    depot: row.depot
      ? { id: num(asRecord(row.depot).id), name: str(asRecord(row.depot).name) }
      : undefined,
  }
}

function normalizeStockBalanceList(raw: unknown): CustomerStockBalance[] {
  const row = asRecord(raw)
  const list = row.stock_balances ?? row.entitlements
  return Array.isArray(list) ? list.map(normalizeStockBalance) : []
}

export function normalizeEntitlementSummary(
  kind: CommercialKind,
  raw: unknown,
): EntitlementSummary {
  const row = asRecord(raw)
  const stockBalances = normalizeStockBalanceList(row)
  const totalDistributed = num(row.total_distributed_qty, num(row.total_bridged_qty))

  return {
    entitlements: stockBalances,
    total_balance_qty: num(row.total_balance_qty),
    total_paid_qty: num(row.total_paid_qty),
    total_bridged_qty:
      kind === 'sales' ? totalDistributed : num(row.total_bridged_qty, totalDistributed),
    total_distributed_qty: kind === 'sales' ? totalDistributed : undefined,
  }
}

export function normalizeProvisionLoading(
  _kind: CommercialKind,
  raw: unknown,
): import('./types').ProvisionLoadingResult {
  const row = asRecord(raw)
  return {
    can_provision: Boolean(row.can_provision),
    total_balance_qty: num(row.total_balance_qty),
    stock_balances: normalizeStockBalanceList(row),
  }
}

export function normalizeLoadsByPhase(raw: unknown): LoadsByPhase {
  const row = asRecord(raw)
  const result: LoadsByPhase = {}
  for (const [key, value] of Object.entries(row)) {
    result[key as TruckLoadPhase] = num(value)
  }
  return result
}

export function normalizePurchaseBridgingProgress(raw: unknown): PurchaseBridgingProgress {
  const row = asRecord(raw)
  return {
    invoice_id: num(row.invoice_id),
    invoice_number: optionalStr(row.invoice_number),
    bridging_status: str(row.bridging_status, 'unbridged'),
    total_invoiced_qty: num(row.total_invoiced_qty),
    total_paid_qty: num(row.total_paid_qty),
    total_bridged_qty: num(row.total_bridged_qty),
    total_balance_qty: num(row.total_balance_qty),
    entitlements: unwrapResourceList(row.entitlements).map(normalizeStockBalance),
    truck_loads: normalizeTruckLoads(row.truck_loads),
    loads_by_phase: normalizeLoadsByPhase(row.loads_by_phase),
  }
}

export function normalizeSalesDistributionProgress(raw: unknown): SalesDistributionProgress {
  const row = asRecord(raw)
  return {
    invoice_id: num(row.invoice_id),
    invoice_number: optionalStr(row.invoice_number),
    distribution_status: str(row.distribution_status, 'undistributed'),
    is_credit_terms: row.is_credit_terms === true,
    distribution_block_reason: optionalStr(row.distribution_block_reason) as
      | SalesDistributionProgress['distribution_block_reason']
      | undefined,
    total_invoiced_qty: num(row.total_invoiced_qty),
    total_paid_qty: num(row.total_paid_qty),
    total_distributed_qty: num(row.total_distributed_qty),
    total_balance_qty: num(row.total_balance_qty),
    bridged_trucks_available_count: num(row.bridged_trucks_available_count),
    stock_balances: normalizeStockBalanceList(row),
    truck_loads: normalizeTruckLoads(row.truck_loads),
    loads_by_phase: normalizeLoadsByPhase(row.loads_by_phase),
  }
}

export function normalizeUnbridgedPurchaseRow(raw: unknown): UnbridgedPurchaseRow {
  const row = asRecord(raw)
  const bridgingStatus = optionalStr(row.bridging_status)

  return {
    id: num(row.id),
    invoice_number: str(row.invoice_number),
    invoice_date: str(row.invoice_date),
    due_date: str(row.due_date),
    total_amount: num(row.total_amount),
    total_bridged_qty: row.total_bridged_qty != null ? num(row.total_bridged_qty) : undefined,
    total_balance_qty: row.total_balance_qty != null ? num(row.total_balance_qty) : undefined,
    total_paid_qty: row.total_paid_qty != null ? num(row.total_paid_qty) : undefined,
    bridging_status: bridgingStatus,
    status: str(row.status),
    display_status: str(row.display_status, str(row.status)),
    supplier: row.supplier
      ? {
          id: num(asRecord(row.supplier).id),
          name: str(asRecord(row.supplier).name),
          company_name: optionalStr(asRecord(row.supplier).company_name) ?? null,
        }
      : undefined,
    depot: row.depot
      ? { id: num(asRecord(row.depot).id), name: str(asRecord(row.depot).name) }
      : undefined,
    loading_depot: row.loading_depot
      ? { id: num(asRecord(row.loading_depot).id), name: str(asRecord(row.loading_depot).name) }
      : undefined,
  }
}

export function normalizeUndistributedSalesRow(raw: unknown): UndistributedSalesRow {
  const row = asRecord(raw)
  const distributed = num(row.distributed_qty, num(row.total_bridged_qty))

  return {
    id: num(row.id),
    invoice_number: str(row.invoice_number),
    invoice_date: str(row.invoice_date),
    due_date: str(row.due_date),
    total_amount: num(row.total_amount),
    distributed_qty: distributed,
    undistributed_qty: num(row.undistributed_qty, num(row.total_balance_qty)),
    total_paid_qty: row.total_paid_qty != null ? num(row.total_paid_qty) : undefined,
    total_bridged_qty: row.total_bridged_qty != null ? num(row.total_bridged_qty) : undefined,
    total_distributed_qty: row.total_distributed_qty != null ? num(row.total_distributed_qty) : distributed,
    distribution_status: optionalStr(row.distribution_status),
    status: str(row.status),
    display_status: str(row.display_status, str(row.status)),
    customer: row.customer
      ? {
          id: num(asRecord(row.customer).id),
          name: str(asRecord(row.customer).name),
          company_name: optionalStr(asRecord(row.customer).company_name) ?? null,
        }
      : undefined,
    depot: row.depot
      ? { id: num(asRecord(row.depot).id), name: str(asRecord(row.depot).name) }
      : undefined,
  }
}
