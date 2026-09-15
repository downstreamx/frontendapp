import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type DistributionRow = Record<string, unknown> & { id: number }

/** Fleet truck row returned for empty / released trucks in transit list. */
export type EmptyTruckInTransitRow = {
  id: number
  plate_number: string
  make?: string | null
  truck_model?: string | null
  avatar?: string | null
  capacity_litres?: number | string | null
  status?: string | null
  operational_status?: string | null
  current_truck_load_id?: number | null
  provider_id?: number | null
  truck_provider?: { id: number; name: string } | null
  released_at?: string | null
}

export type DistributionField = {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'datetime-local'
  lookup?: string
  required?: boolean
  defaultValue?: string | number
}

export type DistributionIndexMeta = {
  statuses: string[]
  depots?: Array<{ id: number; name: string; state?: string }>
  products?: Array<{ id: number; name: string; sku?: string; image?: string | null }>
  trucks?: Array<{
    id: number
    plate_number?: string
    make?: string
    truck_model?: string
    avatar?: string | null
  }>
  transits?: Array<{ id: number; transit_number?: string; status?: string }>
  loading_schedules?: Array<{ id: number; schedule_number?: string; scheduled_date?: string }>
  delivery_schedules?: Array<{ id: number; delivery_number?: string; scheduled_at?: string; status?: string }>
  movement_types?: Array<{ id: number; name: string; code?: string }>
  depot_reps?: Array<{ id: number; first_name?: string; last_name?: string; email?: string }>
  transporters?: Array<{ id: number; name: string }>
  truck_loads?: Array<{
    id: number
    load_number?: string
    phase?: string
  }>
  /** @deprecated Use truck_loads — backend alias during transition */
  drivers?: Array<{ id: number; first_name?: string; last_name?: string }>
}

export async function fetchDistributionIndexMeta(apiPath: string) {
  const { data } = await api.get<ApiSuccess<DistributionIndexMeta>>(`${apiPath}/index-meta`)
  return data.data
}

export async function listDistributionResourcePaginated(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<DistributionRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>(path, { params })
  return extractPaginatedList<DistributionRow>(data)
}

export async function createDistributionResource(path: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<DistributionRow>>(path, body)
  return data.data
}

export async function getDistributionResource(path: string, id: number) {
  const { data } = await api.get<ApiSuccess<DistributionRow>>(`${path}/${id}`)
  return data.data
}

export async function updateDistributionResource(path: string, id: number, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<DistributionRow>>(`${path}/${id}`, body)
  return data.data
}

export async function advanceDistributionStatus(path: string, id: number) {
  const { data } = await api.post<ApiSuccess<DistributionRow>>(`${path}/${id}/advance-status`)
  return data.data
}

export async function postInventoryMovement(id: number) {
  const { data } = await api.post<ApiSuccess<DistributionRow>>(
    `/distribution/inventory-movements/${id}/post`,
  )
  return data.data
}

export type DistributionInformationSearchType =
  | 'truck-load'
  | 'loading-schedule'
  | 'delivery-confirmation'

export type DistributionInformationLookupOption = {
  id: number
  label: string
}

export async function fetchDistributionInformationLookups(
  type: DistributionInformationSearchType,
): Promise<DistributionInformationLookupOption[]> {
  const { data } = await api.get<ApiSuccess<{ options: DistributionInformationLookupOption[] }>>(
    '/distribution/information/lookups',
    { params: { type } },
  )
  return data.data.options ?? []
}

export type DistributionInformation = Record<string, unknown>

export async function fetchDistributionInformation(params: Record<string, string | undefined>) {
  const { data } = await api.get<ApiSuccess<DistributionInformation>>('/distribution/information', {
    params,
  })
  return data.data
}

export const distributionAdvanceLabels: Record<string, Record<string, string>> = {
  '/distribution/loading-schedules': {
    not_left: 'Mark in transit',
    in_transit: 'Mark arrived',
    arrived: 'Mark at depot',
  },
  '/distribution/receiving-schedules': {
    in_transit: 'Mark arrived',
    arrived: 'Mark at depot',
  },
  '/distribution/transits': {
    planned: 'Depart',
    in_transit: 'Mark arrived',
  },
  '/distribution/delivery-schedules': {
    scheduled: 'Start delivery',
    in_progress: 'Mark delivered',
  },
  '/distribution/shortages': {
    open: 'Mark resolved',
  },
  '/distribution/overages': {
    open: 'Mark resolved',
  },
}

export type DistributionListFilterKey =
  | 'status'
  | 'depot_id'
  | 'truck_id'
  | 'transit_id'
  | 'product_id'
  | 'depot_rep_id'
  | 'truck_load_id'
  | 'date_from'
  | 'date_to'

export type DistributionListFilters = Record<DistributionListFilterKey, string>

export const emptyDistributionListFilters: DistributionListFilters = {
  status: '',
  depot_id: '',
  truck_id: '',
  transit_id: '',
  product_id: '',
  depot_rep_id: '',
  truck_load_id: '',
  date_from: '',
  date_to: '',
}

export const distributionListConfig: Record<
  string,
  {
    filters: DistributionListFilterKey[]
    supportsAdvance?: boolean
    supportsPost?: boolean
  }
> = {
  '/distribution/loading-schedules': {
    filters: ['status', 'depot_id', 'truck_id', 'product_id', 'depot_rep_id', 'truck_load_id', 'date_from', 'date_to'],
    supportsAdvance: true,
  },
  '/distribution/receiving-schedules': {
    filters: ['status', 'depot_id', 'truck_id', 'product_id', 'depot_rep_id', 'truck_load_id', 'date_from', 'date_to'],
    supportsAdvance: true,
  },
  '/distribution/transits': { filters: ['status', 'truck_id'], supportsAdvance: true },
  '/distribution/delivery-schedules': {
    filters: ['status', 'depot_id', 'product_id', 'depot_rep_id', 'truck_load_id', 'date_from', 'date_to'],
    supportsAdvance: true,
  },
  '/distribution/delivery-confirmations': {
    filters: ['truck_load_id', 'date_from', 'date_to'],
  },
  '/distribution/shortages': { filters: ['status', 'transit_id', 'truck_load_id'], supportsAdvance: true },
  '/distribution/overages': { filters: ['status', 'transit_id', 'truck_load_id'], supportsAdvance: true },
  '/distribution/inventory-movements': { filters: ['status', 'depot_id'], supportsPost: true },
}

export async function listEmptyTrucksInTransit(
  params?: Record<string, string>,
): Promise<PaginatedListResult<EmptyTruckInTransitRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/distribution/trucks-in-transit', {
    params: { cargo: 'empty', ...params },
  })
  return extractPaginatedList<EmptyTruckInTransitRow>(data)
}
