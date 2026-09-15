/** Unified truck load lifecycle (API: truck_loads). */

export const TRUCK_LOAD_PHASES = [
  'awaiting_load',
  'in_transit_bridged',
  'arrived',
  'assigned',
  'in_transit_distribution',
  'delivered',
  'cancelled',
] as const

export type TruckLoadPhase = (typeof TRUCK_LOAD_PHASES)[number]

export const PURCHASE_BRIDGING_STATUSES = [
  'not_eligible',
  'unbridged',
  'partially_bridged',
  'fully_bridged',
] as const

export type PurchaseBridgingStatus = (typeof PURCHASE_BRIDGING_STATUSES)[number]

export const SALES_DISTRIBUTION_STATUSES = [
  'not_eligible',
  'undistributed',
  'partially_distributed',
  'fully_distributed',
] as const

export type SalesDistributionStatus = (typeof SALES_DISTRIBUTION_STATUSES)[number]

export type TruckLoadTruck = {
  id: number
  plate_number?: string
  make?: string
  avatar?: string | null
  operational_status?: string | null
  capacity_litres?: number
}

export type TruckLoadDriver = {
  id: number
  first_name?: string
  last_name?: string
  user?: { id: number; avatar?: string | null }
}

export type TruckLoadDepot = {
  id: number
  name: string
}

export type TruckLoadInvoiceRef = {
  id: number
  invoice_number?: string
  total_amount?: number
}

export type TruckLoadProductRef = {
  id: number
  name: string
  sku?: string
}

export type TruckLoadCustomerRef = {
  id: number
  name: string
}

export type TruckLoadSalesAllocation = {
  id: number
  truck_load_id: number
  sales_invoice_id: number
  customer_stock_balance_id: number
  quantity: number
  sales_invoice?: TruckLoadInvoiceRef | null
}

export type TruckLoad = {
  id: number
  truck_load_id: number
  load_number: string
  phase: TruckLoadPhase
  next_phase?: TruckLoadPhase | null
  purchase_invoice_id?: number | null
  sales_invoice_id?: number | null
  supplier_product_entitlement_id?: number | null
  customer_stock_balance_id?: number | null
  product_id?: number | null
  truck_id?: number
  driver_id?: number | null
  loading_depot_id?: number | null
  loading_date?: string
  quantity: number
  quantity_unit?: string
  assigned_qty: number
  delivered_qty: number
  remaining_assignable_qty: number
  destination?: string
  waybill_number?: string
  meter_number?: string
  notes?: string
  approved_at?: string | null
  released_at?: string | null
  truck?: TruckLoadTruck
  driver?: TruckLoadDriver
  loading_depot?: TruckLoadDepot
  purchase_invoice?: TruckLoadInvoiceRef | null
  sales_invoice?: TruckLoadInvoiceRef | null
  sales_allocations?: TruckLoadSalesAllocation[]
  is_fully_assigned?: boolean
  product?: TruckLoadProductRef
  customer?: TruckLoadCustomerRef
  unit_rate?: number
}

export type CustomerStockBalance = {
  id: number
  product_id: number
  depot_id?: number | null
  paid_qty: number
  /** Supplier purchase entitlements */
  bridged_qty: number
  /** Customer sales stock balances */
  distributed_qty?: number
  balance_qty: number
  bridged_truck_count?: number
  status: string
  product?: { id: number; name: string; sku?: string }
  depot?: { id: number; name: string }
}

export type LoadsByPhase = Partial<Record<TruckLoadPhase, number>>

export type PurchaseBridgingProgress = {
  invoice_id: number
  invoice_number?: string
  bridging_status: PurchaseBridgingStatus | string
  total_invoiced_qty: number
  total_paid_qty: number
  total_bridged_qty: number
  total_balance_qty: number
  entitlements: CustomerStockBalance[]
  truck_loads: TruckLoad[]
  loads_by_phase?: LoadsByPhase
}

export type SalesDistributionBlockReason =
  | 'prepaid_requires_payment'
  | 'service_invoice_not_eligible'
  | 'missing_depot'
  | 'insufficient_depot_stock'
  | 'entitlements_missing'

export type SalesDistributionProgress = {
  invoice_id: number
  invoice_number?: string
  distribution_status: SalesDistributionStatus | string
  is_credit_terms?: boolean
  distribution_block_reason?: SalesDistributionBlockReason | null
  total_invoiced_qty: number
  total_paid_qty: number
  total_distributed_qty: number
  total_balance_qty: number
  bridged_trucks_available_count: number
  stock_balances: CustomerStockBalance[]
  truck_loads: TruckLoad[]
  loads_by_phase?: LoadsByPhase
}

export type StockBalanceSummary = {
  stock_balances: CustomerStockBalance[]
  total_balance_qty: number
  total_paid_qty: number
  total_bridged_qty?: number
  total_distributed_qty?: number
}

/** @deprecated Use StockBalanceSummary for sales; entitlements kept for purchase */
export type EntitlementSummary = {
  entitlements: CustomerStockBalance[]
  total_balance_qty: number
  total_paid_qty: number
  total_bridged_qty?: number
  total_distributed_qty?: number
}

export type ProvisionLoadingResult = {
  can_provision: boolean
  total_balance_qty: number
  stock_balances: CustomerStockBalance[]
}

export type UndistributedSalesRow = {
  id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  undistributed_qty: number
  distributed_qty?: number
  total_paid_qty?: number
  total_bridged_qty?: number
  total_distributed_qty?: number
  distribution_status?: SalesDistributionStatus | string
  status: string
  display_status: string
  customer?: { id: number; name: string; company_name?: string | null }
  depot?: { id: number; name: string }
}

export type UnbridgedPurchaseRow = {
  id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  total_amount: number
  total_bridged_qty?: number
  total_balance_qty?: number
  total_paid_qty?: number
  bridging_status?: PurchaseBridgingStatus | string
  status: string
  display_status: string
  supplier?: { id: number; name: string; company_name?: string | null }
  depot?: { id: number; name: string }
  loading_depot?: { id: number; name: string }
}

export type StoreTruckLoadBasePayload = {
  truck_id: number
  driver_id?: number
  loading_depot_id: number
  loading_date: string
  quantity: number
  destination: string
  waybill_number?: string
  meter_number?: string
  notes?: string
  load_number?: string
}

export type StorePurchaseTruckLoadPayload = StoreTruckLoadBasePayload & {
  supplier_product_entitlement_id: number
}

export type StoreTruckLoadPayload = StorePurchaseTruckLoadPayload

export type AssignTruckLoadPayload = {
  truck_load_id?: number
  sales_invoice_id: number
  customer_stock_balance_id: number
  quantity?: number
}

export type BulkAssignTruckLoadsPayload = {
  customer_stock_balance_id: number
  assignments: { truck_load_id: number; quantity: number }[]
}

export type BulkStorePurchaseTruckLoadPayload = {
  supplier_product_entitlement_id: number
  loading_depot_id: number
  loading_date: string
  destination: string
  waybill_number?: string
  meter_number?: string
  notes?: string
  loads: { truck_id: number; quantity: number }[]
}

export type ConfirmTruckLoadDeliveryPayload = {
  quantity_delivered?: number
}

export type BridgedAvailableTruckLoad = TruckLoad
