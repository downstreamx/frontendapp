import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'
import { listDepots } from '@/features/depots/api'
import { listProductsAll } from '@/features/inventory/api'

export type LookupMediaKind = 'truck' | 'driver' | 'product' | 'customer' | 'supplier'

/** Select options for CRUD/forms — `id` (numeric) or `value` (string) keys are both supported. */
export type LookupOption = {
  label: string
  id?: number | string
  value?: string | number
  image?: string | null
  mediaKind?: LookupMediaKind
}

export type TruckLookupRow = {
  id: number
  plate_number?: string
  make?: string | null
  truck_model?: string | null
  avatar?: string | null
}

export type DriverLookupRow = {
  id: number
  name?: string
  display_name?: string
  first_name?: string
  last_name?: string
  email?: string
  avatar?: string | null
}

export type ProductLookupRow = {
  id: number
  name: string
  sku?: string | null
  image?: string | null
}

export function toTruckLookupOptions(rows: TruckLookupRow[]): LookupOption[] {
  return rows.map((t) => ({
    id: t.id,
    label: [t.plate_number, t.make, t.truck_model].filter(Boolean).join(' · ') || `#${t.id}`,
    image: t.avatar ?? null,
    mediaKind: 'truck' as const,
  }))
}

export function toDriverLookupOptions(rows: DriverLookupRow[]): LookupOption[] {
  return rows.map((d) => {
    const name =
      d.name ??
      d.display_name ??
      ([d.first_name, d.last_name].filter(Boolean).join(' ') || `#${d.id}`)
    return {
      id: d.id,
      label: d.email ? `${name} (${d.email})` : name,
      image: d.avatar ?? null,
      mediaKind: 'driver' as const,
    }
  })
}

export function toProductLookupOptions(rows: ProductLookupRow[]): LookupOption[] {
  return rows.map((p) => ({
    id: p.id,
    label: p.sku ? `${p.name} (${p.sku})` : p.name,
    image: p.image ?? null,
    mediaKind: 'product' as const,
  }))
}

export type CustomerLookupRow = {
  id: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
}

export type SupplierLookupRow = {
  id: number
  name: string
  email?: string | null
  company_name?: string | null
  company_logo?: string | null
}

export function customerPartyLabel(row: CustomerLookupRow): string {
  if (row.company_name) {
    return `${row.company_name} - ${row.name}`
  }

  return row.email ? `${row.name} (${row.email})` : row.name
}

export function supplierPartyLabel(row: SupplierLookupRow): string {
  if (row.company_name) {
    return `${row.company_name} - ${row.name}`
  }

  return row.email ? `${row.name} (${row.email})` : row.name
}

export function toCustomerLookupOptions(rows: CustomerLookupRow[]): LookupOption[] {
  return rows.map((row) => ({
    id: row.id,
    label: customerPartyLabel(row),
    image: row.company_logo ?? null,
    mediaKind: 'customer' as const,
  }))
}

export function toSupplierLookupOptions(rows: SupplierLookupRow[]): LookupOption[] {
  return rows.map((row) => ({
    id: row.id,
    label: supplierPartyLabel(row),
    image: row.company_logo ?? null,
    mediaKind: 'supplier' as const,
  }))
}

export function lookupOptionValue(option: LookupOption): string {
  if (option.value !== undefined && option.value !== '') {
    return String(option.value)
  }
  if (option.id !== undefined && option.id !== '') {
    return String(option.id)
  }
  return ''
}

export type DistributionMeta = {
  depots: Array<{ id: number; name: string; city?: string }>
  products: Array<{ id: number; name: string; sku?: string; image?: string | null }>
  trucks: Array<{
    id: number
    plate_number: string
    make?: string
    truck_model?: string
    capacity_litres?: number
    operational_status?: string
    default_driver_id?: number | null
    avatar?: string | null
  }>
  customers: Array<{
    id: number
    name: string
    email?: string
    company_name?: string | null
    company_logo?: string | null
  }>
  drivers: Array<{ id: number; name: string; email?: string; avatar?: string | null }>
  loading_schedules: Array<{ id: number; schedule_number?: string; scheduled_date?: string; status?: string }>
  transits: Array<{ id: number; transit_number?: string; status?: string; quantity?: string }>
  inventory_movement_types?: Array<{ id: number; name: string; code?: string; direction?: string }>
}

export type DistributionMetaParams = {
  trucks_operational_status?: string
}

export async function fetchDistributionMeta(
  params?: DistributionMetaParams,
): Promise<DistributionMeta> {
  const { data } = await api.get<ApiSuccess<DistributionMeta>>('/distribution/create-meta', {
    params,
  })
  return data.data
}

function paginatedRows<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== 'object') return []
  const wrapped = payload as { data?: T[] }
  if (Array.isArray(wrapped.data)) return wrapped.data
  return Array.isArray(payload) ? (payload as T[]) : []
}

export async function fetchDepotOptions(): Promise<LookupOption[]> {
  const depots = await listDepots()
  return depots.map((d) => ({ id: d.id, label: d.city ? `${d.name} (${d.city})` : d.name }))
}

export async function fetchProductOptions(): Promise<LookupOption[]> {
  const products = await listProductsAll()
  return toProductLookupOptions(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      image: p.image,
    })),
  )
}

export async function fetchTruckOptions(): Promise<LookupOption[]> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/trucks', { params: { per_page: 100 } })
  return toTruckLookupOptions(
    paginatedRows<TruckLookupRow>(data.data),
  )
}

export async function fetchCustomerOptions(): Promise<LookupOption[]> {
  const { data } = await api.get<
    ApiSuccess<{
      customers: Array<{
        id: number
        name: string
        email?: string
        company_name?: string | null
        company_logo?: string | null
      }>
    }>
  >('/account/customer-payments/create-meta')
  return toCustomerLookupOptions(data.data.customers ?? [])
}

export async function fetchSupplierOptions(): Promise<LookupOption[]> {
  const { data } = await api.get<
    ApiSuccess<{
      suppliers: Array<{
        id: number
        name: string
        email?: string
        company_name?: string | null
        company_logo?: string | null
      }>
    }>
  >('/account/supplier-payments/create-meta')
  return toSupplierLookupOptions(data.data.suppliers ?? [])
}

export async function fetchMovementTypes() {
  const { data } = await api.get<ApiSuccess<unknown>>('/distribution/inventory-movement-types', {
    params: { per_page: 100 },
  })
  return extractListRows(data.data) as Array<{
    id: number
    name: string
    code?: string
    direction: string
    is_active: boolean
  }>
}

export async function createMovementType(body: {
  name: string
  code?: string
  direction: 'in' | 'out'
  is_active?: boolean
}) {
  const { data } = await api.post<ApiSuccess<unknown>>('/distribution/inventory-movement-types', body)
  return data.data
}
